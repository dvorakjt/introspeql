import { columnDataSchema, type ColumnData } from './column-data';
import type { Client } from 'pg';

export async function readColumnData(
  client: Client,
  tableOID: number,
): Promise<ColumnData[]> {
  const result = await client.query(
    `
SELECT jsonb_build_object(
  'name',
  a.attname,
  'type',
  jsonb_build_object(
    'oid',
	  CASE WHEN a.attndims > 0 THEN (
      SELECT base_type.oid
	    FROM pg_catalog.pg_type AS array_type, pg_catalog.pg_type as base_type
	    WHERE array_type.oid = a.atttypid AND base_type.typarray = array_type.oid
    ) ELSE a.atttypid END,
	  'schema',
	  (
	    SELECT nspname 
	    FROM pg_catalog.pg_namespace
	    WHERE oid = t.typnamespace
  	),
	  'name',
	  CASE WHEN a.attndims > 0 THEN (
      SELECT base_type.typname
	    FROM pg_catalog.pg_type AS array_type, pg_catalog.pg_type as base_type
	    WHERE array_type.oid = a.atttypid AND base_type.typarray = array_type.oid
    ) ELSE t.typname END,
    'isEnum',
	  CASE WHEN a.attndims > 0 THEN (
      SELECT t2.typtype = 'e' AS is_enum
	    FROM pg_catalog.pg_type AS t1, pg_catalog.pg_type as t2
	    INNER JOIN pg_catalog.pg_namespace AS n ON t2.typnamespace = n.oid
	    WHERE t1.oid = a.atttypid AND t2.typarray = t1.oid
    ) ELSE t.typtype = 'e' END,
	  'numDimensions',
	  a.attndims,
	  'isNullable',
	  NOT a.attnotnull
  ),
  'comment',
  col_description(a.attrelid, a.attnum)
) FROM pg_catalog.pg_class AS c
INNER JOIN pg_catalog.pg_namespace AS n ON c.relnamespace = n.oid
INNER JOIN pg_catalog.pg_attribute AS a ON c.oid = a.attrelid
INNER JOIN pg_catalog.pg_type AS t ON a.atttypid = t.oid
WHERE c.oid = $1
AND a.attnum >= 1;`,
    [tableOID],
  );

  const rows = result.rows.map(r => r.jsonb_build_object);
  const columnData = columnDataSchema.array().parse(rows);
  return columnData;
}
