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
import type { ParsedIntrospeQLConfig } from "./introspeql-config";

export async function introspectDatabase(config: ParsedIntrospeQLConfig) {
  const client =
    "dbConnectionString" in config
      ? new Client({
          connectionString: config.dbConnectionString,
        })
      : new Client({
          ...config.dbConnectionParams,
        });

  try {
    await client.connect();
  } catch (e) {
    throw new Error("Failed to connect to the database.", { cause: e });
  }

  // Read table data
  let tableDataObjects: TableData[];

  try {
    tableDataObjects = await introspectTables(client, config);
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
    procedureDataObjects = await introspectProcedures(client, config);
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

  // introspect enums
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

  const outputPath =
    "outFile" in config
      ? config.outFile
      : path.join(config.outDir, "introspeql-types.ts");

  writeHeader(outputPath, config);

  const schemas = prepareDataForWriting(
    enumDataObjects,
    tableDataObjects,
    columnDataObjectsByTableId,
    procedureDataObjects,
    config
  );

  schemas.forEach((schema) => appendSchema(outputPath, schema));
}
