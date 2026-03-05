import { z } from 'zod';

const typeSchema = z.object({
  oid: z.coerce.number(),
  schema: z.string(),
  name: z.string(),
  isEnum: z.boolean(),
  isArray: z.boolean(),
});

export const functionDataSchema = z.object({
  schema: z.string(),
  name: z.string(),
  overloads: z
    .object({
      paramTypes: typeSchema
        .and(
          z.object({
            isOptional: z.boolean(),
            isVariadic: z.boolean(),
          }),
        )
        .array(),
      returnType: typeSchema,
      comment: z.string().nullable(),
    })
    .array(),
});

export type FunctionData = z.infer<typeof functionDataSchema>;
