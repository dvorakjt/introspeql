import { z } from 'zod';
import { entityData } from './entity-data';

export const tableOptions = z
  .object({
    /**
     * Determines the default behavior for including and excluding tables.
     *
     * If `mode` is set to `'inclusive'` (the default), all tables will be
     * included in the output, except those listed in the `excludeTables`
     * configuration option, or those that include `"@introspeql-exclude"` in
     * their PostgreSQL comments.
     *
     * If `mode` is set to `'exclusive'`, only tables listed in the
     * `includeTables` configuration option or those that include
     * `"@introspeql-include"` in their PostgreSQL comment will be included in
     * the output.
     */
    mode: z.enum(['inclusive', 'exclusive']).optional().default('inclusive'),
  })
  .and(
    z.union([
      z.object({
        mode: z.literal('inclusive').optional().default('inclusive'),
        /**
         * An array of tables for which type definitions should not be
         * generated. Only valid if `mode` is `'inclusive'`.
         */
        excludeTables: entityData
          .array()
          .optional()
          .default(() => []),
        includeTables: z.undefined().optional(),
      }),
      z.object({
        mode: z.literal('exclusive'),
        /**
         * An array of tables for which type definitions should be generated.
         * Only valid if `mode` is `'exclusive'`.
         */
        includeTables: entityData
          .array()
          .optional()
          .default(() => []),
        excludeTables: z.undefined().optional(),
      }),
    ]),
  );
