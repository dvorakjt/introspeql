import { z } from "zod";
import type { Client } from "pg";
import type { IntrospeQLConfigType } from "./introspeql-config";

const typeSchema = z.object({
  id: z.coerce.number(),
  schema: z.string(),
  name: z.string(),
  is_array: z.boolean(),
  is_enum: z.boolean(),
});

const procedureDataSchema = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  arg_names: z
    .string()
    .array()
    .nullable()
    .transform((v) => (v ? v : [])),
  arg_types: typeSchema.array(),
  return_type: typeSchema,
});

export type ProcedureData = z.infer<typeof procedureDataSchema>;

export async function introspectProcedures(
  client: Client,
  config: IntrospeQLConfigType
) {
  const schemaPlaceholders = config.schemas
    .map((_, i) => `$${i + 1}`)
    .join(", ");

  let query = `
SELECT 
  p.oid AS id, 
  n.nspname AS schema,
  p.proname AS name, 
  p.proargnames AS arg_names, 
  ARRAY(
    SELECT jsonb_build_object(
	  'id',
	  t.oid,
	  'schema',
	  n.nspname,
	  'name',
	  t.typname,
	  'is_array',
	  EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = pt.*),
	  'is_enum',
	  t.typtype = 'e'
	) FROM UNNEST(p.proargtypes) AS pt
	INNER JOIN pg_catalog.pg_type as t
	ON 
	  CASE 
	    WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = pt.*) 
		THEN pt.* = t.typarray
		ELSE pt.* = t.oid
	  END
	INNER JOIN pg_catalog.pg_namespace AS n
	ON t.typnamespace = n.oid
  ) AS arg_types,
  (
    SELECT jsonb_build_object(
	  'id',
	  t.oid,
	  'schema',
	  n.nspname,
	  'name',
	  t.typname,
	  'is_array',
	  EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = p.prorettype),
	  'is_enum',
	  t.typtype = 'e'
	) FROM pg_catalog.pg_type AS t
	INNER JOIN pg_catalog.pg_namespace as n
	ON t.typnamespace = n.oid
	WHERE
	  CASE 
	    WHEN EXISTS(SELECT 1 FROM pg_catalog.pg_type AS t WHERE t.typarray = p.prorettype) 
		THEN t.typarray = p.prorettype
		ELSE t.oid = p.prorettype
	  END
  ) AS return_type
FROM pg_catalog.pg_proc AS p
INNER JOIN pg_catalog.pg_namespace AS n ON p.pronamespace = n.oid
WHERE n.nspname IN (${schemaPlaceholders})
`;

  const parameters = [...config.schemas];

  if (config.ignoreProcedures.length > 0) {
    let offset = schemaPlaceholders.length;
    const filters: string[] = [];

    for (const procedureToIgnore of config.ignoreProcedures) {
      filters.push(`(n.nspname = $${offset++} AND p.proname = $${offset++})`);
      parameters.push(procedureToIgnore.schema);
      parameters.push(procedureToIgnore.name);
    }

    query += `AND NOT (${filters.join(" OR\n")})`;
  }

  query += ";";

  const result = await client.query(query, parameters);
  const procedureData = procedureDataSchema.array().parse(result.rows);
  return procedureData;
}
