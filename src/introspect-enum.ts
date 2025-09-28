import { z } from "zod";
import type { Client } from "pg";

export type PartialEnumData = {
  /** The OID of the enum. */
  id: number;
  /** The name of the schema in which the enum was defined. */
  schema: string;
  /** The name of the enum. */
  name: string;
};

export type EnumData = PartialEnumData & {
  values: string[];
};

/**
 * Reads metadata for the provided enum.
 *
 * @param client
 * @param data
 * @returns A {@link Promise}<{@link EnumData}[]>
 */
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
