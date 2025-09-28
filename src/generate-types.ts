import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { introspectTables, type TableData } from "./introspect-tables";
import { introspectColumns, type ColumnData } from "./introspect-columns";
import { introspectProcedures, ProcedureData } from "./introspect-procedures";
import {
  introspectEnum,
  type PartialEnumData,
  type EnumData,
} from "./introspect-enum";
import { writeHeader } from "./write-header";
import { prepareDataForWriting } from "./prepare-data-for-writing";
import { appendSchema } from "./append-schema";
import { introspeqlConfig, type IntrospeQLConfig } from "./introspeql-config";

/**
 * Reads table, function, and enum metadata from a database and writes
 * corresponding TypeScript type definitions to the provided output path.
 *
 * @param config
 */
export async function generateTypes(config: IntrospeQLConfig) {
  const parsedConfig = introspeqlConfig.parse(config);

  const client =
    "dbConnectionString" in parsedConfig
      ? new Client({
          connectionString: parsedConfig.dbConnectionString,
        })
      : new Client({
          ...parsedConfig.dbConnectionParams,
        });

  try {
    await client.connect();
  } catch (e) {
    throw new Error("Failed to connect to the database.", { cause: e });
  }

  // Read table data
  let tableDataObjects: TableData[];

  try {
    tableDataObjects = await introspectTables(client, parsedConfig);
  } catch (e) {
    throw new Error("Failed to introspect tables.", { cause: e });
  }

  // Read column data and update enums object when enum types are found
  const columnDataObjectsByTableId: Record<number, ColumnData[]> = {};

  const partialEnumDataObjects: PartialEnumData[] = [];

  for (const tableDataObj of tableDataObjects) {
    try {
      const columnDataObjects = await introspectColumns(
        client,
        tableDataObj.id
      );
      columnDataObjectsByTableId[tableDataObj.id] = columnDataObjects;

      for (const columnDataObj of columnDataObjects) {
        if (
          columnDataObj.is_enum &&
          !partialEnumDataObjects.find(
            (d) => d.id === columnDataObj.column_type_id
          )
        ) {
          partialEnumDataObjects.push({
            id: columnDataObj.column_type_id,
            schema: columnDataObj.column_type_schema,
            name: columnDataObj.column_type,
          });
        }
      }
    } catch (e) {
      throw new Error("Failed to introspect columns.", { cause: e });
    }
  }

  // Read procedure data and update enums object when enum types are found
  let procedureDataObjects: ProcedureData[];

  try {
    procedureDataObjects = await introspectProcedures(client, parsedConfig);
  } catch (e) {
    throw new Error("Failed to introspect procedures.", { cause: e });
  }

  for (const procedureDataObject of procedureDataObjects) {
    for (const argType of procedureDataObject.arg_types) {
      if (
        argType.is_enum &&
        !partialEnumDataObjects.find((d) => d.id === argType.id)
      ) {
        partialEnumDataObjects.push({
          id: argType.id,
          schema: argType.schema,
          name: argType.name,
        });
      }
    }

    if (
      procedureDataObject.return_type.is_enum &&
      !partialEnumDataObjects.find(
        (d) => d.id === procedureDataObject.return_type.id
      )
    ) {
      partialEnumDataObjects.push({
        id: procedureDataObject.return_type.id,
        schema: procedureDataObject.return_type.schema,
        name: procedureDataObject.return_type.name,
      });
    }
  }

  // Read enum metadata for all enums that were featured in tables or procedures
  const enumDataObjects: EnumData[] = [];

  for (const partialEnumDataObj of partialEnumDataObjects) {
    try {
      const enumData = await introspectEnum(client, partialEnumDataObj);
      enumDataObjects.push(enumData);
    } catch (e) {
      throw new Error("Failed to introspect enum.", { cause: e });
    }
  }

  await client.end();

  const outDir = path.dirname(config.outFile);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  if (!fs) writeHeader(parsedConfig.outFile, parsedConfig);

  const schemas = prepareDataForWriting(
    enumDataObjects,
    tableDataObjects,
    columnDataObjectsByTableId,
    procedureDataObjects,
    parsedConfig
  );

  schemas.forEach((schema) => appendSchema(parsedConfig.outFile, schema));
}
