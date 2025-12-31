import type { Client } from 'pg';
import { enumDataSchema, readEnumData, type EnumData } from '../enums';
import {
  functionDataSchema,
  readFunctionData,
  type FunctionData,
} from '../functions';
import {
  columnDataSchema,
  readColumnData,
  readTableData,
  tableDataSchema,
  type ColumnData,
  type TableData,
} from '../tables';
import type { ParsedConfig } from '../config';

export interface TableDataWithColumns extends TableData {
  columns: ColumnData[];
}

export interface SchemaData {
  name: string;
  enums: EnumData[];
  functions: FunctionData[];
  tables: TableDataWithColumns[];
}

export async function readSchemaData(
  client: Client,
  parsedConfig: ParsedConfig,
) {
  const schemas: Record<string, SchemaData> = {};
  const functions = await readFunctionData(client, parsedConfig);

  for (const f of functions) {
    registerDBObject(f, schemas);

    for (const overload of f.overloads) {
      for (const paramType of overload.paramTypes) {
        await readAndRegisterTypeIfEnum(
          paramType,
          client,
          parsedConfig,
          schemas,
        );
      }

      await readAndRegisterTypeIfEnum(
        overload.returnType,
        client,
        parsedConfig,
        schemas,
      );
    }
  }

  const tables = await readTableData(client, parsedConfig);

  for (const t of tables) {
    const columns = await readColumnData(client, t.oid);

    const tableDataWithColumns = {
      ...t,
      columns,
    };

    registerDBObject(tableDataWithColumns, schemas);

    for (const column of columns) {
      await readAndRegisterTypeIfEnum(
        column.type,
        client,
        parsedConfig,
        schemas,
      );
    }
  }

  return schemas;
}

function registerDBObject(
  dbObject: EnumData | FunctionData | TableDataWithColumns,
  schemas: Record<string, SchemaData>,
) {
  if (!(dbObject.schema in schemas)) {
    schemas[dbObject.schema] = {
      name: dbObject.schema,
      enums: [],
      functions: [],
      tables: [],
    };
  }

  if (isEnumData(dbObject)) {
    schemas[dbObject.schema].enums.push(dbObject);
  } else if (isFunctionData(dbObject)) {
    schemas[dbObject.schema].functions.push(dbObject);
  } else if (isTableDataWithColumns(dbObject)) {
    schemas[dbObject.schema].tables.push(dbObject);
  }
}

function isEnumData(
  dbObject: EnumData | FunctionData | TableDataWithColumns,
): dbObject is EnumData {
  return enumDataSchema.safeParse(dbObject).success;
}

function isFunctionData(
  dbObject: EnumData | FunctionData | TableDataWithColumns,
): dbObject is FunctionData {
  return functionDataSchema.safeParse(dbObject).success;
}

function isTableDataWithColumns(
  dbObject: EnumData | FunctionData | TableDataWithColumns,
): dbObject is TableDataWithColumns {
  return (
    tableDataSchema.safeParse(dbObject).success &&
    'columns' in dbObject &&
    columnDataSchema.array().safeParse(dbObject.columns).success
  );
}

async function readAndRegisterTypeIfEnum(
  maybeEnum: {
    oid: number;
    schema: string;
    name: string;
    isEnum: boolean;
  },
  client: Client,
  parsedConfig: ParsedConfig,
  schemas: Record<string, SchemaData>,
) {
  if (
    maybeEnum.isEnum &&
    !isEnumDefinedInConfig(maybeEnum.schema, maybeEnum.name, parsedConfig) &&
    !(
      maybeEnum.schema in schemas &&
      schemas[maybeEnum.schema].enums.some(e => e.name === maybeEnum.name)
    )
  ) {
    const enumData = await readEnumData(client, maybeEnum.oid);
    registerDBObject(enumData, schemas);
  }
}

function isEnumDefinedInConfig(
  schema: string,
  name: string,
  parsedConfig: ParsedConfig,
) {
  return `${schema}.${name}` in parsedConfig.types;
}
