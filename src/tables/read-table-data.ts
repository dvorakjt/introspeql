import { tableDataSchema, type TableData } from './table-data';
import { shouldIncludeTable } from './should-include-table';
import type { Client } from 'pg';
import type { ParsedConfig } from '../config';

export async function readTableData(
  client: Client,
  config: ParsedConfig,
): Promise<TableData[]> {
  const schemaPlaceholders = config.schemas
    .map((_, i) => `$${i + 1}`)
    .join(', ');

  const query = `
SELECT 
  c.oid AS oid, 
  n.nspname AS schema, 
  c.relname AS name,
  obj_description(c.oid, 'pg_class') AS comment
FROM pg_catalog.pg_class AS c
INNER JOIN pg_catalog.pg_namespace AS n ON c.relnamespace = n.oid
WHERE c.relkind = 'r' AND n.nspname IN (${schemaPlaceholders});
`;

  const parameters = [...config.schemas];

  const result = await client.query(query, parameters);
  const tableData = tableDataSchema
    .array()
    .parse(result.rows)
    .filter(({ name, schema, comment }) =>
      shouldIncludeTable({
        name,
        schema,
        comment,
        mode: config.tables.mode,
        exceptions:
          config.tables.mode === 'inclusive' ?
            config.tables.excludeTables
          : config.tables.includeTables,
      }),
    );

  return tableData;
}
