import { z } from 'zod';

export const columnDataSchema = z.object({
  name: z.string(),
  type: z.object({
    oid: z.coerce.number(),
    schema: z.string(),
    name: z.string(),
    isEnum: z.boolean(),
    numDimensions: z.number(),
    isNullable: z.boolean(),
    generated: z.enum(['never', 'by_default', 'always']),
  }),
  comment: z.string().nullable(),
});

export type ColumnData = z.infer<typeof columnDataSchema>;
