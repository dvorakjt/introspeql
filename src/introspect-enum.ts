import { z } from "zod";
import type { Client } from "pg";

export async function introspectEnum(client: Client, enumId: number) {
  const query = `
SELECT ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = $1)::text[] AS enum_values;
`;

  const parameters = [enumId];

  const result = await client.query(query, parameters);

  const { enum_values: enumValues } = z
    .object({
      enum_values: z.string().array(),
    })
    .parse(result.rows[0]);

  return enumValues;
}
