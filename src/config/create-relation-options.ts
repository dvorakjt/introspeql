import {
  z,
  ZodArray,
  ZodDefault,
  ZodLiteral,
  ZodObject,
  ZodOptional,
  ZodUndefined,
} from 'zod';
import { entityData } from './entity-data';
import { capitalize } from '../shared/capitalize';

/**
 * Creates a Zod object that can parse IntrospeQL configuration options for
 * database objects described in the pg_class table, including tables, views,
 * and materialized views.
 */
export function createRelationOptions<
  T extends 'table' | 'view' | 'materializedView',
>(relationName: T) {
  const includeRelationsPropertyKey =
    `include${capitalize(relationName)}s` as const;

  const excludeRelationsPropertyKey =
    `exclude${capitalize(relationName)}s` as const;

  type IncludeRelationsPropertyKey = typeof includeRelationsPropertyKey;
  type ExcludeRelationsPropertyKey = typeof excludeRelationsPropertyKey;

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
          [excludeRelationsPropertyKey]: entityData
            .array()
            .optional()
            .default(() => []),
          [includeRelationsPropertyKey]: z.undefined().optional(),
        }) as unknown as ZodObject<
          { mode: ZodDefault<ZodOptional<ZodLiteral<'inclusive'>>> } & {
            [K in ExcludeRelationsPropertyKey]: ZodDefault<
              ZodOptional<ZodArray<typeof entityData>>
            >;
          } & {
            [K in IncludeRelationsPropertyKey]: ZodOptional<ZodUndefined>;
          }
        >,
        z.object({
          mode: z.literal('exclusive'),
          /**
           * An array of relations for which type definitions should be
           * generated. Only valid if `mode` is `'exclusive'`.
           */
          [includeRelationsPropertyKey]: entityData
            .array()
            .optional()
            .default(() => []),
          [excludeRelationsPropertyKey]: z.undefined().optional(),
        }) as unknown as ZodObject<
          { mode: ZodLiteral<'exclusive'> } & {
            [K in IncludeRelationsPropertyKey]: ZodDefault<
              ZodOptional<ZodArray<typeof entityData>>
            >;
          } & {
            [K in ExcludeRelationsPropertyKey]: ZodOptional<ZodUndefined>;
          }
        >,
      ]),
    );
}
