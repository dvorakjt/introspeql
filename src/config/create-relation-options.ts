import { z } from 'zod';
import { entityData } from './entity-data';
import { capitalize } from '../shared/capitalize';

export function createRelationOptions<
  T extends 'table' | 'view' | 'materializedView',
>(relationName: T) {
  const include =
    `include${capitalize(relationName)}s` as `include${Capitalize<T>}s`;
  const exclude =
    `exclude${capitalize(relationName)}s` as `exclude${Capitalize<T>}s`;

  return z
    .object({
      /**
       * Determines the default behavior for including and excluding relations.
       *
       * If `mode` is set to `'inclusive'` (the default), all relations will be
       * included in the output, except those explictly excluded with
       * configuration options or those that include `"@introspeql-exclude"` in
       * their PostgreSQL comments.
       *
       * If `mode` is set to `'exclusive'`, only relations explictly included
       * with configuration options or those that include `"@introspeql-include"`
       * in their PostgreSQL comment will be included in the output.
       */
      mode: z.enum(['inclusive', 'exclusive']).optional().default('inclusive'),
    })
    .and(
      z.union([
        z.object({
          mode: z.literal('inclusive').optional().default('inclusive'),
          /**
           * An array of relations for which type definitions should not be
           * generated. Only valid if `mode` is `'inclusive'`.
           */
          [exclude]: entityData
            .array()
            .optional()
            .default(() => []),
          [include]: z.undefined().optional(),
        }),
        z.object({
          mode: z.literal('exclusive'),
          /**
           * An array of relations for which type definitions should be
           * generated. Only valid if `mode` is `'exclusive'`.
           */
          [include]: entityData
            .array()
            .optional()
            .default(() => []),
          [exclude]: z.undefined().optional(),
        }),
      ]),
    );
}
