import rc from "rc";
import {
  introspeqlConfig,
  type IntrospeQLConfigType,
} from "./introspeql-config";
import { ZodError } from "zod";

const defaults: Partial<IntrospeQLConfigType> = {
  schemas: ["public"],
  head: "",
  types: {
    "pg_catalog.bool": "boolean",
    "pg_catalog.int2": "number",
    "pg_catalog.int4": "number",
    "pg_catalog.float4": "number",
    "pg_catalog.float8": "number",
    "pg_catalog.json": "object",
    "pg_catalog.jsonb": "object",
    "pg_catalog.date": "Date",
    "pg_catalog.timestamp": "Date",
    "pg_catalog.timestamptz": "Date",
    // bytea => buffer (?)
  },
  ignoreTables: [],
  ignoreProcedures: [],
};

// should be able to read from environment variables
function readConfig() {
  try {
    const config = introspeqlConfig.parse(rc("introspeql", defaults));
    return config;
  } catch (e) {
    if (e instanceof ZodError) {
      throw new Error("Failed to parse config file.", { cause: e });
    }

    throw e;
  }
}

export { readConfig };
