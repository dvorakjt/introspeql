import { z } from 'zod';

export const relationDataSchema = z.object({
  oid: z.number(),
  schema: z.string(),
  name: z.string(),
  comment: z.string().nullable(),
});

export type RelationData = z.infer<typeof relationDataSchema>;
