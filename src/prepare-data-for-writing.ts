import { snakeCaseToPascalCase } from './snake-case-to-pascal-case';
import type { EnumData } from './introspect-enum';
import type { TableData } from './introspect-tables';
import type { ColumnData } from './introspect-columns';
import type { ProcedureData } from './introspect-procedures';
import type { ParsedIntrospeQLConfig } from './introspeql-config';

export interface Schema {
  formattedName: string;
  rawName: string;
  enums: Array<{
    name: string;
    values: string[];
  }>;
  tables: Array<{
    formattedName: string;
    rawName: string;
    columnNames: Record<string, string>;
    rowType: Record<string, string>;
  }>;
  procedures: Array<{
    formattedName: string;
    rawName: string;
    argNames: string[];
    argTypes: string[];
    returnType: string;
  }>;
}

/**
 * Organizes data by schema, table, and procedure, and formats it in
 * preparation for type generation.
 *
 * @param enumDataObjects
 * @param tableDataObjects
 * @param columnDataObjectsByTableId
 * @param procedureDataObjects
 * @param config
 * @returns An array of {@link Schema} objects.
 */
export function prepareDataForWriting(
  enumDataObjects: EnumData[],
  tableDataObjects: TableData[],
  columnDataObjectsByTableId: Record<number, ColumnData[]>,
  procedureDataObjects: ProcedureData[],
  config: ParsedIntrospeQLConfig,
): Schema[] {
  const schemas: Schema[] = [];

  prepareEnums(enumDataObjects, schemas, config);
  prepareTables(tableDataObjects, columnDataObjectsByTableId, schemas, config);
  prepareProcedures(procedureDataObjects, schemas, config);

  return schemas;
}

function prepareEnums(
  enumDataObjects: EnumData[],
  schemas: Schema[],
  config: ParsedIntrospeQLConfig,
) {
  for (const enumDataObj of enumDataObjects) {
    // If the enum is overridden by configuration options, skip it.
    const typeMappingKey = `${enumDataObj.schema}.${enumDataObj.name}`;
    if (typeMappingKey in config.types) continue;

    const schema = findOrInsertSchema(schemas, enumDataObj.schema);
    const formattedEnumName = snakeCaseToPascalCase(enumDataObj.name);

    schema.enums.push({
      name: formattedEnumName,
      values: enumDataObj.values,
    });
  }
}

function prepareTables(
  tableDataObjects: TableData[],
  columnDataObjectsByTableId: Record<number, ColumnData[]>,
  schemas: Schema[],
  config: ParsedIntrospeQLConfig,
) {
  for (const tableDataObj of tableDataObjects) {
    const schema = findOrInsertSchema(schemas, tableDataObj.schema);

    const tableData = {
      formattedName: snakeCaseToPascalCase(tableDataObj.name),
      rawName: tableDataObj.name,
      columnNames: columnDataObjectsByTableId[tableDataObj.id].reduce(
        (acc, current) => {
          const formattedColumnName = snakeCaseToPascalCase(
            current.column_name,
          );
          acc[formattedColumnName] = current.column_name;
          return acc;
        },
        {} as Record<string, string>,
      ),
      rowType: columnDataObjectsByTableId[tableDataObj.id].reduce(
        (acc, current) => {
          let type: string;

          const typeMappingKey = `${current.column_type_schema}.${current.column_type}`;

          if (typeMappingKey in config.types) {
            type = config.types[typeMappingKey as keyof typeof config.types];
          } else if (current.is_enum) {
            const formattedEnumName = snakeCaseToPascalCase(
              current.column_type,
            );
            type = `Enums.${formattedEnumName}`;

            if (current.column_type_schema !== schema.rawName) {
              const formattedEnumSchemaName = snakeCaseToPascalCase(
                current.column_type_schema,
              );
              type = `${formattedEnumSchemaName}.${type}`;
            }
          } else {
            type = 'string';
          }

          type += '[]'.repeat(current.num_dimensions);

          if (current.nullable) {
            type += ' | null';
          }

          acc[current.column_name] = type;

          return acc;
        },
        {} as Record<string, string>,
      ),
    };

    schema.tables.push(tableData);
  }
}

function prepareProcedures(
  procedureDataObjects: ProcedureData[],
  schemas: Schema[],
  config: ParsedIntrospeQLConfig,
) {
  for (const procDataObj of procedureDataObjects) {
    const schema = findOrInsertSchema(schemas, procDataObj.schema);

    const extantProcedureDeclarations = schema.procedures.filter(
      p => p.rawName === procDataObj.name,
    ).length;

    const procData = {
      formattedName:
        snakeCaseToPascalCase(procDataObj.name) +
        (extantProcedureDeclarations > 0 ?
          '_' + extantProcedureDeclarations
        : ''),
      rawName: procDataObj.name,
      argNames: procDataObj.arg_names,
      argTypes: procDataObj.arg_types.map(a => {
        let type: string;

        const typeMappingKey = `${a.schema}.${a.name}`;

        if (typeMappingKey in config.types) {
          type = config.types[typeMappingKey as keyof typeof config.types];
        } else if (a.is_enum) {
          const formattedEnumName = snakeCaseToPascalCase(a.name);
          type = `Enums.${formattedEnumName}`;

          if (a.schema !== schema.rawName) {
            const formattedEnumSchemaName = snakeCaseToPascalCase(a.schema);
            type = `${formattedEnumSchemaName}.${type}`;
          }
        } else {
          type = 'string';
        }

        if (a.is_array) {
          type += '[]';
        }

        return type;
      }),
      returnType: (() => {
        let type: string;

        const typeMappingKey = `${procDataObj.return_type.schema}.${procDataObj.return_type.name}`;

        if (typeMappingKey in config.types) {
          type = config.types[typeMappingKey as keyof typeof config.types];
        } else if (procDataObj.return_type.is_enum) {
          const formattedEnumName = snakeCaseToPascalCase(
            procDataObj.return_type.name,
          );
          type = `Enums.${formattedEnumName}`;

          if (procDataObj.return_type.schema !== schema.rawName) {
            const formattedEnumSchemaName = snakeCaseToPascalCase(
              procDataObj.return_type.schema,
            );
            type = `${formattedEnumSchemaName}.${type}`;
          }
        } else {
          type = 'string';
        }

        if (procDataObj.return_type.is_array) {
          type += '[]';
        }

        return type;
      })(),
    };

    schema.procedures.push(procData);
  }
}

function findOrInsertSchema(schemas: Schema[], rawName: string) {
  let schema = schemas.find(s => s.rawName === rawName);
  if (schema) return schema;

  schema = {
    formattedName: snakeCaseToPascalCase(rawName),
    rawName,
    enums: [],
    tables: [],
    procedures: [],
  };

  schemas.push(schema);

  return schema;
}
