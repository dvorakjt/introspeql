import { z } from 'zod';

export const entityData = z.object({
  schema: z.string(),
  name: z.string(),
});

export type EntityData = z.infer<typeof entityData>;
