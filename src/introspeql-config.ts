import { z } from 'zod';

const databaseConnectionConfig = z.union([
  /**
   * A PostgreSQL connection string specifying the database to connect to.
   * Useful if you are already storing such a string as an environment variable.
   */
  z.object({
    dbConnectionString: z.string(),
  }),
  /**
   * An object containing the components of a PostgreSQL connection string that
   * together specify the database to connect to. Useful if you are already
   * storing such values as individual environment variables.
   */
  z.object({
    dbConnectionParams: z.object({
      user: z.string().optional(),
      password: z.string().optional(),
      host: z.string().optional(),
      port: z.number().optional(),
      database: z.string().optional(),
    }),
  }),
]);

const entityData = z.object({
  schema: z.string(),
  name: z.string(),
});

const otherConfig = z.object({
  /**
   * The file to which TypeScript types will be written.
   */
  outFile: z.string(),
  /**
   * The database schemas from which types should be generated.
   */
  schemas: z
    .string()
    .array()
    .nonempty({
      message: 'Please provide at least one schema.',
    })
    .optional()
    .default(() => ['public']),
  /**
   * An optional header that will be written to the generated type definition
   * file before the types. Useful when you want to define or import types
   * directly in the generated file.
   */
  header: z.string().optional(),
  /**
   * Custom type mappings. Default settings align with transformations applied
   * by node-postgres. To override these settings for a type, provide the
   * name of the schema in which the type is defined and the name of the type
   * (separated by a dot) as the key, and a string representation of the
   * desired type as the value.
   *
   * @example
   * ```
   * {
   *   types: {
   *     "pg_catalog.int8" : "bigint"
   *   }
   * }
   * ```
   */
  types: z
    .record(z.string(), z.string())
    .optional()
    .transform(t => ({
      'pg_catalog.bool': 'boolean',
      'pg_catalog.int2': 'number',
      'pg_catalog.int4': 'number',
      'pg_catalog.float4': 'number',
      'pg_catalog.float8': 'number',
      'pg_catalog.json': 'object',
      'pg_catalog.jsonb': 'object',
      'pg_catalog.date': 'Date',
      'pg_catalog.timestamp': 'Date',
      'pg_catalog.timestamptz': 'Date',
      'pg_catalog.void': 'void',
      ...t,
    })),
  /**
   * An array of tables that should NOT be included in the generated type
   * definitions. Useful for ignoring tables such as `spatial_ref_sys`
   * when using PostGIS, or tables containing information about
   * migrations.
   */
  ignoreTables: entityData
    .array()
    .optional()
    .default(() => []),
  /**
   * An array of procedures that should NOT be included in the generated type
   * definitions.
   */
  ignoreProcedures: entityData
    .array()
    .optional()
    .default(() => []),
});

const introspeqlConfig = z.intersection(databaseConnectionConfig, otherConfig);

type IntrospeQLConfig = z.input<typeof introspeqlConfig>;
type ParsedIntrospeQLConfig = z.infer<typeof introspeqlConfig>;

export { introspeqlConfig, type IntrospeQLConfig, type ParsedIntrospeQLConfig };
