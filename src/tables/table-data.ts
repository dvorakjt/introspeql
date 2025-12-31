import { z } from 'zod';

export const tableDataSchema = z.object({
  oid: z.number(),
  schema: z.string(),
  name: z.string(),
  comment: z.string().nullable(),
});

export type TableData = z.infer<typeof tableDataSchema>;
