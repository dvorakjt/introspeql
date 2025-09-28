import { z } from "zod";
import type { Client } from "pg";
import type { ParsedIntrospeQLConfig } from "./introspeql-config";

const tableDataSchema = z.object({
  /** The OID of the table. */
  id: z.number(),
  /** The name of the schema containing the table. */
  schema: z.string(),
  /** The name of the table. */
  name: z.string(),
});

export type TableData = z.infer<typeof tableDataSchema>;

/**
 * Returns information about tables in the provided schema(s), including their
 * ids, names, and schema names.
 *
 * @param client
 * @param config
 * @returns A {@link Promise}<{@link TableData}[]>
 */
export async function introspectTables(
  client: Client,
  config: ParsedIntrospeQLConfig
): Promise<TableData[]> {
  const schemaPlaceholders = config.schemas
    .map((_, i) => `$${i + 1}`)
    .join(", ");

  let query = `
SELECT c.oid AS id, n.nspname AS schema, c.relname AS name 
FROM pg_catalog.pg_class AS c
INNER JOIN pg_catalog.pg_namespace AS n ON c.relnamespace = n.oid
WHERE c.relkind = 'r' AND n.nspname IN (${schemaPlaceholders})
`;

  const parameters = [...config.schemas];

  if (config.ignoreTables.length > 0) {
    let offset = schemaPlaceholders.length;
    const filters: string[] = [];

    for (const tableToIgnore of config.ignoreTables) {
      filters.push(`(n.nspname = $${offset++} AND c.relname = $${offset++})`);
      parameters.push(tableToIgnore.schema);
      parameters.push(tableToIgnore.name);
    }

    query += `AND NOT (${filters.join(" OR\n")})`;
  }

  query += ";";

  const result = await client.query(query, parameters);
  const tableData = tableDataSchema.array().parse(result.rows);
  return tableData;
}
