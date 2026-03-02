import { enumDataSchema, type EnumData } from './enum-data';
import type { Client } from 'pg';

export async function readEnumData(
  client: Client,
  typeOID: number,
): Promise<EnumData> {
  const query = `
SELECT 
  t.oid AS oid,
  n.nspname AS schema,
  t.typname AS name,
  ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = t.oid)::text[] AS values,
  obj_description(t.oid, 'pg_type') AS comment
FROM pg_catalog.pg_type AS t
INNER JOIN pg_catalog.pg_namespace AS n ON t.typnamespace = n.oid
WHERE t.oid = $1;
`;

  const parameters = [typeOID];
  const results = await client.query(query, parameters);
  const enumData = enumDataSchema.parse(results.rows[0]);
  return enumData;
}
