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
  schemas: z.string().array().nonempty({
    message: "Please provide at least one schema.",
  }),
  head: z.string(),
  types: z.record(z.string(), z.string()),
  ignoreTables: entityData.array(),
  ignoreProcedures: entityData.array(),
});

const introspeqlConfig = z.intersection(
  z.intersection(databaseConnectionConfig, outputConfig),
  otherConfig
);

type IntrospeQLConfigType = z.infer<typeof introspeqlConfig>;

export { introspeqlConfig, type IntrospeQLConfigType };
