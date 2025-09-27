import { z } from "zod";
import type { Client } from "pg";

export type PartialEnumData = {
  id: number;
  schema: string;
  name: string;
};

export type EnumData = PartialEnumData & {
  values: string[];
};

export async function introspectEnum(
  client: Client,
  data: PartialEnumData
): Promise<EnumData> {
  const query = `
SELECT ARRAY(SELECT enumlabel FROM pg_enum WHERE enumtypid = $1)::text[] AS enum_values;
`;

  const parameters = [data.id];

  const result = await client.query(query, parameters);

  const { enum_values: enumValues } = z
    .object({
      enum_values: z.string().array(),
    })
    .parse(result.rows[0]);

  return {
    ...data,
    values: enumValues,
  };
}
