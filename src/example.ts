// @/gen-db-types.ts
import "dotenv/config"; // import dotenv/config to read sensitive values from the .env file
import path from "node:path";
import { introspeql, type IntrospeQLConfig } from ".";

const config: IntrospeQLConfig = {
  dbConnectionString: process.env.DB_CONNECTION_STRING!,
  outFile: path.join(import.meta.dirname, "src/model/db/types.ts"),
  head: "import { Point } from '@/model/types/point.ts';",
};
