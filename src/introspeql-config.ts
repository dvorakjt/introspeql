import { z } from "zod";

const databaseConnectionConfig = z.union([
  z.object({
    dbConnectionString: z.string(),
  }),
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

const outputConfig = z.union([
  z.object({
    outDir: z.string(),
  }),
  z.object({
    outFile: z.string(),
  }),
]);

const entityData = z.object({
  schema: z.string(),
  name: z.string(),
});

const otherConfig = z.object({
  schemas: z
    .string()
    .array()
    .nonempty({
      message: "Please provide at least one schema.",
    })
    .optional()
    .default(() => ["public"]),
  head: z.string().optional(),
  types: z
    .record(z.string(), z.string())
    .optional()
    .transform((t) => ({
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
      "pg_catalog.void": "void",
      ...t,
    })),
  ignoreTables: entityData
    .array()
    .optional()
    .default(() => []),
  ignoreProcedures: entityData
    .array()
    .optional()
    .default(() => []),
});

const introspeqlConfig = z.intersection(
  z.intersection(databaseConnectionConfig, outputConfig),
  otherConfig
);

type IntrospeQLConfig = z.input<typeof introspeqlConfig>;
type ParsedIntrospeQLConfig = z.infer<typeof introspeqlConfig>;

export { introspeqlConfig, type IntrospeQLConfig, type ParsedIntrospeQLConfig };
