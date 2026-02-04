import { z } from 'zod';
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
  readRelationData,
  relationDataSchema,
  type ColumnData,
  type RelationData,
} from '../relations';
import type { ParsedConfig } from '../config';

export interface RelationDataWithColumns extends RelationData {
  columns: ColumnData[];
}

export interface SchemaData {
  name: string;
  enums: EnumData[];
  functions: FunctionData[];
  tables: RelationDataWithColumns[];
  views: RelationDataWithColumns[];
  materializedViews: RelationDataWithColumns[];
}

export async function readSchemaData(
  client: Client,
  parsedConfig: ParsedConfig,
) {
  const schemas: Record<string, SchemaData> = {};

  await Promise.all([
    readAndRegisterFunctionData(schemas, client, parsedConfig),
    readAndRegisterRelationData('table', schemas, client, parsedConfig),
    readAndRegisterRelationData('view', schemas, client, parsedConfig),
    readAndRegisterRelationData(
      'materializedView',
      schemas,
      client,
      parsedConfig,
    ),
  ]);

  return schemas;
}

async function readAndRegisterFunctionData(
  schemas: Record<string, SchemaData>,
  client: Client,
  parsedConfig: ParsedConfig,
) {
  const functions = await readFunctionData(client, parsedConfig);

  for (const f of functions) {
    registerDBObject(f, 'function', schemas);

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
}

async function readAndRegisterRelationData(
  relationType: 'table' | 'view' | 'materializedView',
  schemas: Record<string, SchemaData>,
  client: Client,
  parsedConfig: ParsedConfig,
) {
  const relations = await readRelationData(relationType, client, parsedConfig);

  for (const r of relations) {
    const columns = await readColumnData(client, r.oid);

    const relationDataWithColumns = {
      ...r,
      columns,
    };

    registerDBObject(relationDataWithColumns, relationType, schemas);

    for (const column of columns) {
      await readAndRegisterTypeIfEnum(
        column.type,
        client,
        parsedConfig,
        schemas,
      );
    }
  }
}

function registerDBObject<
  T extends EnumData | FunctionData | RelationDataWithColumns,
>(
  dbObject: T,
  dbObjectType: T extends EnumData ? 'enum'
  : T extends FunctionData ? 'function'
  : 'table' | 'view' | 'materializedView',
  schemas: Record<string, SchemaData>,
) {
  if (!(dbObject.schema in schemas)) {
    schemas[dbObject.schema] = {
      name: dbObject.schema,
      enums: [],
      functions: [],
      tables: [],
      views: [],
      materializedViews: [],
    };
  }

  const relationDataWithColumns = z.intersection(
    relationDataSchema,
    z.object({
      columns: columnDataSchema.array(),
    }),
  );

  switch (dbObjectType) {
    case 'enum':
      const enumData = enumDataSchema.parse(dbObject);
      schemas[dbObject.schema].enums.push(enumData);
      break;
    case 'function':
      const functionData = functionDataSchema.parse(dbObject);
      schemas[dbObject.schema].functions.push(functionData);
      break;
    case 'table':
      const tableData = relationDataWithColumns.parse(dbObject);
      schemas[dbObject.schema].tables.push(tableData);
      break;
    case 'view':
      const viewData = relationDataWithColumns.parse(dbObject);
      schemas[dbObject.schema].views.push(viewData);
      break;
    case 'materializedView':
      const materializedViewData = relationDataWithColumns.parse(dbObject);
      schemas[dbObject.schema].materializedViews.push(materializedViewData);
      break;
  }
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
    registerDBObject(enumData, 'enum', schemas);
  }
}

function isEnumDefinedInConfig(
  schema: string,
  name: string,
  parsedConfig: ParsedConfig,
) {
  return `${schema}.${name}` in parsedConfig.types;
}
