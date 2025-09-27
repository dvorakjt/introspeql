import { z } from "zod";
import type { Client } from "pg";

const columnDataSchema = z.object({
  column_name: z.string(),
  column_type_schema: z.string(),
  column_type_id: z.number(),
  column_type: z.string(),
  is_enum: z.boolean(),
  num_dimensions: z.number(),
  nullable: z.boolean(),
});

export type ColumnData = z.infer<typeof columnDataSchema>;

export async function introspectColumns(client: Client, tableId: number) {
  const result = await client.query(
    `
SELECT
  a.attname AS column_name, 
  (
	  SELECT nspname 
	  FROM pg_catalog.pg_namespace
	  WHERE oid = t.typnamespace
  ) AS column_type_schema,
  CASE WHEN a.attndims > 0 THEN (
    SELECT base_type.oid
	  FROM pg_catalog.pg_type AS array_type, pg_catalog.pg_type as base_type
	  WHERE array_type.oid = a.atttypid AND base_type.typarray = array_type.oid
  ) ELSE a.atttypid END AS column_type_id,
  CASE WHEN a.attndims > 0 THEN (
    SELECT base_type.typname
	  FROM pg_catalog.pg_type AS array_type, pg_catalog.pg_type as base_type
	  WHERE array_type.oid = a.atttypid AND base_type.typarray = array_type.oid
  ) ELSE t.typname END AS column_type,
  CASE WHEN a.attndims > 0 THEN (
    SELECT t2.typtype = 'e' AS is_enum
	  FROM pg_catalog.pg_type AS t1, pg_catalog.pg_type as t2
	  INNER JOIN pg_catalog.pg_namespace AS n ON t2.typnamespace = n.oid
	  WHERE t1.oid = a.atttypid AND t2.typarray = t1.oid
  ) ELSE t.typtype = 'e' END AS is_enum,
  a.attndims AS num_dimensions,
  NOT a.attnotnull As nullable 
FROM pg_catalog.pg_class AS c
INNER JOIN pg_catalog.pg_namespace AS n ON c.relnamespace = n.oid
INNER JOIN pg_catalog.pg_attribute AS a ON c.oid = a.attrelid
INNER JOIN pg_catalog.pg_type AS t ON a.atttypid = t.oid
WHERE c.oid = $1
AND a.attnum >= 1;`,
    [tableId]
  );

  const columnData = columnDataSchema.array().parse(result.rows);
  return columnData;
}
