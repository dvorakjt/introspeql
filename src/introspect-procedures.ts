import { z } from 'zod';
import type { Client } from 'pg';
import type { ParsedIntrospeQLConfig } from './introspeql-config';

const typeSchema = z.object({
  /** The OID of the type. */
  id: z.coerce.number(),
  /** The name of the schema in which the type was defined. */
  schema: z.string(),
  /**
   * The name of the type, or the name of the type of each element if the type
   * is an array.
   */
  name: z.string(),
  /** Whether or not the type is an array. */
  is_array: z.boolean(),
  /**
   * Whether or not the type (or the type of each element if the type is an
   * array) is an enum.
   */
  is_enum: z.boolean(),
});

const procedureDataSchema = z.object({
  /** The OID of the procedure. */
  id: z.number(),
  /** The name of the schema in which the procedure was defined. */
  schema: z.string(),
  /** The name of the procedure. */
  name: z.string(),
  /**
   * An array containing the names of the procedure's arguments. Note that this
   * array can be empty even for procedures with arguments if those arguments
   * are unnamed.
   */
  arg_names: z
    .string()
    .array()
    .nullable()
    .transform(v => (v ? v : [])),
  /**
   * An array containing type information for each of the procedure's
   * arguments.
   */
  arg_types: typeSchema.array(),
  /**
   * Type information for the procedure's return type.
   */
  return_type: typeSchema,
});

export type ProcedureData = z.infer<typeof procedureDataSchema>;

/**
 * Reads information about procedures in the provided schema(s), including their
 * ids, names, schema names, argument names, argument types, and return type.
 *
 * @param client
 * @param config
 * @returns A {@link Promise}<{@link ProcedureData}[]>
 */
export async function introspectProcedures(
  client: Client,
  config: ParsedIntrospeQLConfig,
) {
  const schemaPlaceholders = config.schemas
    .map((_, i) => `$${i + 1}`)
    .join(', ');

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

    query += `AND NOT (${filters.join(' OR\n')})`;
  }

  query += ';';

  const result = await client.query(query, parameters);
  const procedureData = procedureDataSchema.array().parse(result.rows);
  return procedureData;
}
