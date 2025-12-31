import { describe, test, beforeEach, afterEach, expect } from 'vitest';
import { DEFAULT_TYPE_MAPPINGS } from '../../../config/default-type-mappings';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import { faker } from '@faker-js/faker';

describe('DEFAULT_TYPE_MAPPINGS', () => {
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

  test(
    'explicitly defined default type mappings match the types returned by node-postgres.',
    async () => {
      const columns: string[] = [];

      for (const type of Object.keys(DEFAULT_TYPE_MAPPINGS)) {
        // Columns cannot be void
        if (type === 'pg_catalog.void') continue;

        const columnName = getDerivedColumnNameFromType(type);
        const columnDefinition = `${columnName} ${type}`;
        columns.push(columnDefinition);
      }

      const tableName = faker.string.alpha();
      const tableCreationQuery =
        `CREATE TABLE ${tableName} (` + columns.join(',') + ');';

      await client.query(tableCreationQuery);

      const minShort = -(2 ** 15);
      const maxShort = 2 ** 15 - 1;

      const values = Object.entries(DEFAULT_TYPE_MAPPINGS)
        .filter(([type]) => type !== 'pg_catalog.void')
        .map(([type, mapping]) => {
          switch (mapping) {
            case 'boolean':
              return faker.datatype.boolean();
            case 'number':
              if (type.includes('int')) {
                return faker.number.int({
                  min: minShort,
                  max: maxShort,
                });
              }

              return faker.number.float();
            case 'Date':
              return faker.date.anytime();
            case 'object':
              return {
                propertyOne: faker.string.alpha(),
                propertyTwo: faker.number.int({
                  min: minShort,
                  max: maxShort,
                }),
                propertyThree: faker.date.anytime(),
              };
            case 'Buffer':
              return Buffer.alloc(10);
          }
        });

      const insertStatement = `INSERT INTO ${tableName} VALUES (${values.map((_, i) => '$' + (i + 1)).join(',')});`;
      await client.query(insertStatement, values);

      const { rows } = await client.query(`SELECT * FROM ${tableName};`);
      const rowValues = Object.values(rows[0]);

      for (let i = 0; i < rowValues.length; i++) {
        const actualValue = rowValues[i];
        const expectedValue = values[i];

        expect(typeof actualValue).toBe(typeof expectedValue);

        /*
          If the expected value is an object, verify that it has a constructor 
          with a name property and that the actual value shares these traits.
        */
        if (expectedValue !== null && typeof expectedValue === 'object') {
          if (
            'constructor' in expectedValue &&
            'name' in expectedValue.constructor
          ) {
            if (
              !!actualValue &&
              typeof actualValue === 'object' &&
              'constructor' in actualValue &&
              'name' in actualValue.constructor
            ) {
              expect(actualValue.constructor.name).toBe(
                expectedValue.constructor.name,
              );
            } else {
              throw new Error(
                'expectedValue was an object with a constructor, but actual value was not.',
              );
            }
          } else {
            throw new Error(
              'expectedValue was an object without a constructor.',
            );
          }
        } else {
          // Otherwise, check that the values of match.
          if (typeof expectedValue === 'number') {
            /*
              A check has already been performed to verify that expectedValue 
              and actualValue are of the same type.
            */
            expect(expectedValue).toBeCloseTo(actualValue as number);
          } else {
            expect(expectedValue).toBe(actualValue);
          }
        }
      }

      function getDerivedColumnNameFromType(type: string) {
        return type.split('.')[1];
      }
    },
    Infinity,
  );
});
