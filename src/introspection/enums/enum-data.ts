import { z } from 'zod';

export const enumDataSchema = z.object({
  oid: z.coerce.number(),
  schema: z.string(),
  name: z.string(),
  values: z.string().array(),
  comment: z.string().nullable(),
});

export type EnumData = z.infer<typeof enumDataSchema>;
