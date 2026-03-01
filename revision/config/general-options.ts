import { z } from 'zod';
import { DEFAULT_TYPE_MAPPINGS } from './default-type-mappings';

export const generalOptions = z.object({
  /**
   * The database schemas from which types should be generated. At least one
   * schema must be specified. The default value is `['public']`.
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
    .transform<Record<string, string>>(t => ({
      ...DEFAULT_TYPE_MAPPINGS,
      ...t,
    })),
  /**
   * If `true` (the default), comments attached to tables, columns, and
   * enums will be included as TSDoc-style comments in the output
   * (`"@introspeQL-"` directives within those comments will be removed).
   *
   * To opt out of this behavior when it is enabled, a table, enum, or column
   * can include `"@introspeql-disable-tsdoc-comments"` in its comment.
   *
   * To opt into this behavior when it is disabled, a table, column, or enum
   * can include `"@introspeql-enable-tsdoc-comments"` in its comment.
   *
   * By default, the behavior applied to a table will dictate the behavior
   * applied to its columns unless the comment on a particular column includes
   * one of the above directives.
   *
   * To include only certain sections of a comment, enclose them with
   * `"@introspeql-begin-tsdoc-comment"` and `"@introspeql-end-tsdoc-comment"`.
   */
  copyComments: z.boolean().optional().default(true),
});
