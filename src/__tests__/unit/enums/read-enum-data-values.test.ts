import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import { readEnumData } from '../../../enums';

describe(
  'readEnumData',
  () => {
    let database: PostgresMock;
    let client: Client;

    beforeEach(async () => {
      database = await PostgresMock.create();
      client = new Client(database.getNodePostgresConfig());
      await client.connect();
    });

    afterEach(async () => {
      await client.end();
      database.destroy();
    });

    it('reads the values of an enum.', async () => {
      const enumName = 'user_roles';
      const enumValues = ['user', 'admin', 'owner'];
      const enumComment = 'User privileges are regulated by this value.';

      await client.query(
        `CREATE TYPE ${enumName} AS ENUM (${enumValues.map(v => `'${v}'`).join(', ')});`,
      );

      await client.query(`COMMENT ON TYPE ${enumName} IS '${enumComment}'`);

      const results = await client.query(
        `SELECT oid FROM pg_catalog.pg_type WHERE typname = '${enumName}';`,
      );

      const { oid } = results.rows[0];

      const enumData = await readEnumData(client, oid);

      expect(enumData).toStrictEqual({
        oid,
        name: enumName,
        schema: 'public',
        values: enumValues,
        comment: enumComment,
      });
    });
  },
  Infinity,
);
