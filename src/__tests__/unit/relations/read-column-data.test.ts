import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import { faker } from '@faker-js/faker';
import { readColumnData } from '../../../relations';

describe(
  'readColumnData',
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

    test('it reads column data for the provided table.', async () => {
      await client.query(
        "CREATE TYPE user_role AS ENUM ('user', 'admin', 'owner');",
      );

      const tableName = 'users';

      await client.query(
        `
CREATE TABLE ${tableName} (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  last_name VARCHAR(255) NOT NULL,
  hobbies VARCHAR[] NOT NULL,
  dob TIMESTAMPTZ NOT NULL,
  role user_role NOT NULL
)`,
      );

      const dobComment = faker.lorem.paragraphs(2);
      await client.query(
        `COMMENT ON COLUMN ${tableName}.dob IS '${dobComment}';`,
      );

      const results = await client.query(
        `SELECT oid FROM pg_catalog.pg_class WHERE relname = '${tableName}';`,
      );
      const { oid: tableId } = results.rows[0];

      const columnData = (await readColumnData(client, tableId)).sort(
        (a, b) => {
          if (a.name < b.name) {
            return -1;
          }

          if (a.name > b.name) {
            return 1;
          }

          return 0;
        },
      );

      expect(columnData).toEqual([
        {
          name: 'dob',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'timestamptz',
            isEnum: false,
            numDimensions: 0,
            isNullable: false,
          },
          comment: dobComment,
        },
        {
          name: 'email',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'varchar',
            isEnum: false,
            numDimensions: 0,
            isNullable: false,
          },
          comment: null,
        },
        {
          name: 'first_name',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'varchar',
            isEnum: false,
            numDimensions: 0,
            isNullable: false,
          },
          comment: null,
        },
        {
          name: 'hobbies',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'varchar',
            isEnum: false,
            numDimensions: 1,
            isNullable: false,
          },
          comment: null,
        },
        {
          name: 'id',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'int4',
            isEnum: false,
            numDimensions: 0,
            isNullable: false,
          },
          comment: null,
        },
        {
          name: 'last_name',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'varchar',
            isEnum: false,
            numDimensions: 0,
            isNullable: false,
          },
          comment: null,
        },
        {
          name: 'middle_name',
          type: {
            oid: expect.any(Number),
            schema: 'pg_catalog',
            name: 'varchar',
            isEnum: false,
            numDimensions: 0,
            isNullable: true,
          },
          comment: null,
        },
        {
          name: 'role',
          type: {
            oid: expect.any(Number),
            schema: 'public',
            name: 'user_role',
            isEnum: true,
            numDimensions: 0,
            isNullable: false,
          },
          comment: null,
        },
      ]);
    });
  },
  Infinity,
);
