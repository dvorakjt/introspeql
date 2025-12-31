import { z } from 'zod';
import { entityData } from './entity-data';

export const functionOptions = z
  .object({
    /**
     * Determines the default behavior for including and excluding functions.
     *
     * If `mode` is set to `'inclusive'` (the default), all functions will be
     * included in the output, except those listed in the `excludeFunctions`
     * configuration option, or those that include `"@introspeql-exclude"` in
     * their PostgreSQL comments.
     *
     * If `mode` is set to `'exclusive'`, only functions listed in the
     * `'includeFunctions'` configuration option or those that include
     * `"@introspeql-include"` in their PostgreSQL comment will be included in
     * the output.
     *
     * If leveraging directives to opt out of the behavior configured here,
     * each overload that you wish to include or exclude must be marked with the
     * appropriate directive.
     */
    mode: z.enum(['inclusive', 'exclusive']).optional().default('inclusive'),
    /**
     * PostgreSQL is unlike TypeScript in that argument types cannot be
     * explicitly marked non-nullable. If you expect to leverage this behavior
     * and potentially call a function with null arguments, set this
     * option to `true`. This will cause all argument types to be transformed
     * into type unions including `null`.
     *
     * To opt out of this behavior when this option is enabled, a function can
     * include `"@introspeql-disable-nullable-args"` in its PostgreSQL comment.
     *
     * To opt into this behavior when this option is disabled, a function can
     * include `"@introspeql-enable-nullable-args"` in its PostgreSQL comment.
     */
    nullableArgs: z.boolean().optional().default(false),
    /**
     * Virtually any PostgreSQL function may potentially return `null`,
     * regardless of its specified return type. Void functions without the
     * `STRICT` modifier are perhaps one of the very few exceptions to this
     * rule.
     *
     * Therefore, all function return types are nullable by default. To
     * disable this behavior, set this option to false.
     *
     * To opt into this behavior when it is disabled, a function can include
     * `"@introspeql-enable-nullable-return-types"` in its PostgreSQL comment.
     *
     * To opt out of this behavior when it is enabled, a function can include
     * `"@introspeql-disable-nullable-return-types"` in its PostgreSQL comment.
     */
    nullableReturnTypes: z.boolean().optional().default(true),
  })
  .and(
    z.union([
      z.object({
        mode: z.literal('inclusive').optional().default('inclusive'),
        excludeFunctions: entityData
          .array()
          .optional()
          .default(() => []),
        includeFunctions: z.undefined().optional(),
      }),
      z.object({
        mode: z.literal('exclusive'),
        includeFunctions: entityData
          .array()
          .optional()
          .default(() => []),
        excludeFunctions: z.undefined().optional(),
      }),
    ]),
  );
