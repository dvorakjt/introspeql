import { z } from 'zod';

export const connectionOptions = z.union([
  z.object({
    /**
     * A PostgreSQL connection string specifying the database to connect to.
     * Useful if you are already storing such a string as an environment variable.
     * Only valid if `dbConnectionParams` is not supplied.
     */
    dbConnectionString: z.string(),
    /**
     * An object containing the components of a PostgreSQL connection string that
     * together specify the database to connect to. Useful if you are already
     * storing such values as individual environment variables. Only valid if
     * `dbConnectionString` is not supplied.
     */
    dbConnectionParams: z.undefined().optional(),
  }),
  z.object({
    /**
     * An object containing the components of a PostgreSQL connection string that
     * together specify the database to connect to. Useful if you are already
     * storing such values as individual environment variables. Only valid if
     * `dbConnectionString` is not supplied.
     */
    dbConnectionParams: z.object({
      user: z.string().optional(),
      password: z.string().optional(),
      host: z.string().optional(),
      port: z.number().optional(),
      database: z.string().optional(),
    }),
    /**
     * A PostgreSQL connection string specifying the database to connect to.
     * Useful if you are already storing such a string as an environment variable.
     * Only valid if `dbConnectionParams` is not supplied.
     */
    dbConnectionString: z.undefined().optional(),
  }),
]);
