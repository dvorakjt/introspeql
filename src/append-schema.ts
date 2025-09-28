import fs from "node:fs";
import type { Schema } from "./prepare-data-for-writing";

/**
 * Appends a namespace representing the given schema to the provided output file.
 *
 * @param outputPath
 * @param schema
 */
export function appendSchema(outputPath: string, schema: Schema) {
  let schemaTypeDefinitions = `export namespace ${schema.formattedName} {\n`;

  schemaTypeDefinitions += `  export const SchemaName = '${schema.rawName}';\n`;

  if (schema.enums.length > 0) {
    schemaTypeDefinitions = appendEnums(schemaTypeDefinitions, schema);
  }

  if (schema.tables.length > 0) {
    schemaTypeDefinitions = appendTables(schemaTypeDefinitions, schema);
  }

  if (schema.procedures.length > 0) {
    schemaTypeDefinitions = appendProcedures(schemaTypeDefinitions, schema);
  }

  schemaTypeDefinitions += `};`;

  fs.appendFileSync(outputPath, schemaTypeDefinitions, "utf-8");
}

function appendEnums(typeDefs: string, schema: Schema) {
  typeDefs += "\n" + " ".repeat(2) + "export namespace Enums {";

  for (const e of schema.enums) {
    typeDefs += "\n" + " ".repeat(4) + `export enum ${e.name} {\n`;
    typeDefs += e.values
      .map((v) => " ".repeat(6) + `${v} = '${v}',\n`)
      .join("");
    typeDefs += " ".repeat(4) + "};\n";
  }

  typeDefs += " ".repeat(2) + `};\n`;
  return typeDefs;
}

function appendTables(typeDefs: string, schema: Schema) {
  typeDefs += "\n" + " ".repeat(2) + "export namespace Tables {";

  for (const t of schema.tables) {
    typeDefs +=
      "\n" + " ".repeat(4) + `export namespace ${t.formattedName} {\n`;

    typeDefs += " ".repeat(6) + `export const TableName = '${t.rawName}';\n`;

    if (Object.entries(t.columnNames).length > 0) {
      typeDefs += "\n" + " ".repeat(6) + "export enum ColumnNames {\n";

      for (const [formattedName, rawName] of Object.entries(t.columnNames)) {
        typeDefs += " ".repeat(8) + `${formattedName} = '${rawName}',\n`;
      }

      typeDefs += " ".repeat(6) + "};\n";
    }

    if (Object.entries(t.rowType).length > 0) {
      typeDefs += "\n" + " ".repeat(6) + "export interface RowType {\n";

      for (const [rawName, type] of Object.entries(t.rowType)) {
        const columnName = Object.entries(t.columnNames).find((entry) => {
          return entry[1] === rawName;
        })![0];

        typeDefs += " ".repeat(8) + `[ColumnNames.${columnName}]: ${type};\n`;
      }

      typeDefs += " ".repeat(6) + "};\n";
    }

    typeDefs += " ".repeat(4) + "};\n";
  }

  typeDefs += " ".repeat(2) + "};\n";

  return typeDefs;
}

function appendProcedures(typeDefs: string, schema: Schema) {
  typeDefs += "\n" + " ".repeat(2) + "export namespace Procedures {";

  for (const proc of schema.procedures) {
    typeDefs +=
      "\n" + " ".repeat(4) + `export namespace ${proc.formattedName} {\n`;

    typeDefs +=
      " ".repeat(6) + `export const ProcedureName = '${proc.rawName}';\n`;

    typeDefs +=
      "\n" +
      " ".repeat(6) +
      `export const ArgNames = [\n` +
      proc.argNames
        .map((n) => {
          return " ".repeat(8) + `'${n}',\n`;
        })
        .join("") +
      " ".repeat(6) +
      "] as const;\n";

    typeDefs +=
      "\n" +
      " ".repeat(6) +
      `export type ArgTypes = [\n` +
      proc.argTypes
        .map((t) => {
          return " ".repeat(8) + t + ",\n";
        })
        .join("") +
      " ".repeat(6) +
      "];\n";

    typeDefs +=
      "\n" + " ".repeat(6) + `export type ReturnType = ${proc.returnType};\n`;

    typeDefs += " ".repeat(4) + "};\n";
  }

  typeDefs += " ".repeat(2) + "};\n";
  return typeDefs;
}
