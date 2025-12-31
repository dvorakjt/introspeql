import { describe, beforeEach, afterEach, it, test, expect } from 'vitest';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import { readFunctionData } from '../../../functions';
import {
  introspeqlConfigSchema,
  type IntrospeQLConfig,
  type ParsedConfig,
} from '../../../config';
import { Directives } from '../../../shared';

describe(
  'readFunctionData',
  () => {
    let database: PostgresMock;
    let client: Client;
    let config: ParsedConfig;

    beforeEach(async () => {
      database = await PostgresMock.create();
      client = new Client(database.getNodePostgresConfig());
      await client.connect();

      const baseConfig: IntrospeQLConfig = {
        dbConnectionString: '',
        writeToDisk: false,
        schemas: ['public'],
      };

      config = introspeqlConfigSchema.parse(baseConfig);
    });

    afterEach(async () => {
      await client.end();
      database.destroy();
    });

    it('reads information about a function.', async () => {
      const functionName = 'custom_add';
      await client.query(
        `CREATE FUNCTION ${functionName} (
          a INTEGER, 
          b INTEGER
        ) RETURNS INTEGER AS $$
        BEGIN 
          RETURN a + b;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      const functionComment = 'Adds two integers.';

      await client.query(
        `COMMENT ON FUNCTION ${functionName} IS '${functionComment}'`,
      );

      const functionData = await readFunctionData(client, config);

      expect(functionData).toEqual([
        {
          schema: 'public',
          name: functionName,
          overloads: [
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: 'Adds two integers.',
            },
          ],
        },
      ]);
    });

    it('reads variadic params.', async () => {
      const functionName = 'custom_add';

      await client.query(
        `CREATE FUNCTION ${functionName} (
          VARIADIC nums INTEGER[]
        ) RETURNS INTEGER AS $$
        BEGIN 
          SELECT SUM(n) FROM UNNEST(nums) AS total;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      const functionData = await readFunctionData(client, config);

      expect(functionData).toEqual([
        {
          schema: 'public',
          name: functionName,
          overloads: [
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: true,
                  isOptional: false,
                  isVariadic: true,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: null,
            },
          ],
        },
      ]);
    });

    it('reads optional params.', async () => {
      const functionName = 'greet';

      await client.query(`
      CREATE FUNCTION ${functionName} (
        greeting VARCHAR DEFAULT 'Hello',
        name VARCHAR = 'World'
      ) RETURNS VARCHAR AS $$
      BEGIN 
        RETURN gretting + ' ' + name + '!';
      END;
      $$ LANGUAGE plpgsql;
        `);

      const functionData = await readFunctionData(client, config);
      expect(functionData).toEqual([
        {
          schema: 'public',
          name: functionName,
          overloads: [
            {
              paramTypes: [
                {
                  oid: 1043,
                  schema: 'pg_catalog',
                  name: 'varchar',
                  isEnum: false,
                  isArray: false,
                  isOptional: true,
                  isVariadic: false,
                },
                {
                  oid: 1043,
                  schema: 'pg_catalog',
                  name: 'varchar',
                  isEnum: false,
                  isArray: false,
                  isOptional: true,
                  isVariadic: false,
                },
              ],
              returnType: {
                oid: 1043,
                schema: 'pg_catalog',
                name: 'varchar',
                isEnum: false,
                isArray: false,
              },
              comment: null,
            },
          ],
        },
      ]);
    });

    it('reads array-type params.', async () => {
      const functionName = 'custom_add';

      await client.query(
        `CREATE FUNCTION ${functionName} (
          nums INTEGER[]
        ) RETURNS INTEGER AS $$
        BEGIN 
          SELECT SUM(n) FROM UNNEST(nums) AS total;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      const functionData = await readFunctionData(client, config);

      expect(functionData).toEqual([
        {
          schema: 'public',
          name: functionName,
          overloads: [
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: true,
                  isOptional: false,
                  isVariadic: false,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: null,
            },
          ],
        },
      ]);
    });

    it('reads multiple overloads of the same function.', async () => {
      const functionName = 'custom_add';

      // Create an overload that accepts 2 integers
      await client.query(
        `CREATE FUNCTION ${functionName} (
          a INTEGER, 
          b INTEGER
        ) RETURNS INTEGER AS $$
        BEGIN 
          RETURN a + b;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      // Create an overload that accepts 3 integers
      await client.query(
        `CREATE FUNCTION ${functionName} (
          a INTEGER, 
          b INTEGER,
          c INTEGER
        ) RETURNS INTEGER AS $$
        BEGIN 
          RETURN a + b + c;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      // Create an overload that accepts an arbitrary number of integers
      await client.query(
        `CREATE FUNCTION ${functionName} (
          VARIADIC nums INTEGER[]
        ) RETURNS INTEGER AS $$
        BEGIN 
          SELECT SUM(n) FROM UNNEST(nums) AS total;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      const comments = [
        'Adds two integers.',
        'Adds three integers.',
        'Adds any number of integers.',
      ];

      await client.query(
        `COMMENT ON FUNCTION ${functionName}(a INTEGER, b INTEGER) IS '${comments[0]}'`,
      );

      await client.query(
        `COMMENT ON FUNCTION ${functionName}(a INTEGER, b INTEGER, c INTEGER) IS '${comments[1]}'`,
      );

      await client.query(
        `COMMENT ON FUNCTION ${functionName}(VARIADIC nums INTEGER[]) IS '${comments[2]}'`,
      );

      const functionData = await readFunctionData(client, config);

      expect(functionData).toEqual([
        {
          schema: 'public',
          name: functionName,
          overloads: [
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: comments[0],
            },
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: comments[1],
            },
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: true,
                  isOptional: false,
                  isVariadic: true,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: comments[2],
            },
          ],
        },
      ]);
    });

    it('omits excluded functions.', async () => {
      const schema = 'public';
      const functionName = 'some_function_to_exclude';

      await client.query(
        `CREATE FUNCTION ${functionName} () RETURNS VOID AS $$
        BEGIN 
          RETURN;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      const baseConfig: IntrospeQLConfig = {
        dbConnectionString: '',
        writeToDisk: false,
        schemas: [schema],
        functions: {
          mode: 'inclusive',
          excludeFunctions: [
            {
              schema,
              name: functionName,
            },
          ],
        },
      };

      config = introspeqlConfigSchema.parse(baseConfig);
      const functionData = await readFunctionData(client, config);
      expect(functionData).toEqual([]);
    });

    it('omits excluded overloads.', async () => {
      const functionName = 'custom_add';

      await client.query(
        `CREATE FUNCTION ${functionName} (
          a INTEGER, 
          b INTEGER
        ) RETURNS INTEGER AS $$
        BEGIN 
          RETURN a + b;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      // This overload will be excluded
      await client.query(
        `CREATE FUNCTION ${functionName} (
          a INTEGER, 
          b INTEGER,
          c INTEGER
        ) RETURNS INTEGER AS $$
        BEGIN 
          RETURN a + b + c;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      await client.query(
        `COMMENT ON FUNCTION ${functionName}(a INTEGER, b INTEGER, c INTEGER) IS '${Directives.Exclude}'`,
      );

      const functionData = await readFunctionData(client, config);
      expect(functionData).toEqual([
        {
          schema: 'public',
          name: functionName,
          overloads: [
            {
              paramTypes: [
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
                {
                  oid: 23,
                  schema: 'pg_catalog',
                  name: 'int4',
                  isEnum: false,
                  isArray: false,
                  isOptional: false,
                  isVariadic: false,
                },
              ],
              returnType: {
                oid: 23,
                schema: 'pg_catalog',
                name: 'int4',
                isEnum: false,
                isArray: false,
              },
              comment: null,
            },
          ],
        },
      ]);
    });

    test('if all overloads of a function are omitted, the function is omitted.', async () => {
      const functionName = 'custom_add';

      await client.query(
        `CREATE FUNCTION ${functionName} (
          a INTEGER, 
          b INTEGER
        ) RETURNS INTEGER AS $$
        BEGIN 
          RETURN a + b;
        END;
        $$ LANGUAGE plpgsql;`,
      );

      await client.query(
        `COMMENT ON FUNCTION ${functionName}(a INTEGER, b INTEGER) IS '${Directives.Exclude}'`,
      );

      const functionData = await readFunctionData(client, config);
      expect(functionData).toEqual([]);
    });
  },
  Infinity,
);
