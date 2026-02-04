import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import { readRelationData } from '../../../relations';
import {
  introspeqlConfigSchema,
  type IntrospeQLConfig,
  type ParsedConfig,
} from '../../../config';
import { faker } from '@faker-js/faker';
import { Directives } from '../../../shared';

describe(
  'readRelationData',
  () => {
    let database: PostgresMock;
    let client: Client;
    let config: ParsedConfig;

    beforeEach(async () => {
      const baseConfig: IntrospeQLConfig = {
        dbConnectionString: '',
        writeToDisk: false,
        schemas: ['public'],
        tables: {
          mode: 'inclusive',
        },
      };

      config = introspeqlConfigSchema.parse(baseConfig);

      database = await PostgresMock.create();
      client = new Client(database.getNodePostgresConfig());
      await client.connect();
    });

    afterEach(async () => {
      await client.end();
      database.destroy();
    });

    test('It reads table data from the database.', async () => {
      const tableNames = ['books', 'authors', 'publishers'];

      for (const tableName of tableNames) {
        await client.query(`CREATE TABLE ${tableName} ();`);
      }

      const tableData = await readRelationData('table', client, config);

      for (const tableName of tableNames) {
        expect(tableData.some(td => td.name === tableName)).toBe(true);
      }
    });

    test('it reads comments on tables.', async () => {
      const tableName = faker.string.alpha();
      const comment = faker.lorem.paragraphs(2);

      await client.query(`CREATE TABLE ${tableName}();`);
      await client.query(`COMMENT ON TABLE ${tableName} IS '${comment}';`);

      const tableData = await readRelationData('table', client, config);
      expect(tableData[0].comment).toBe(comment);
    });

    test('if mode is inclusive and the comments it reads contain the exclude directive, those tables are filtered out.', async () => {
      const tableName = faker.string.alpha();
      const comment = Directives.Exclude;

      await client.query(`CREATE TABLE ${tableName}();`);
      await client.query(`COMMENT ON TABLE ${tableName} IS '${comment}';`);

      const tableData = await readRelationData('table', client, config);
      expect(tableData.length).toBe(0);
    });

    test('if mode is exclusive and the comments it reads contain the include directive, those tables are included.', async () => {
      const tableName = faker.string.alpha();
      const comment = Directives.Include;

      await client.query(`CREATE TABLE ${tableName}();`);
      await client.query(`COMMENT ON TABLE ${tableName} IS '${comment}';`);

      const baseConfig: IntrospeQLConfig = {
        dbConnectionString: '',
        writeToDisk: false,
        schemas: ['public'],
        tables: {
          mode: 'exclusive',
        },
      };

      config = introspeqlConfigSchema.parse(baseConfig);

      const tableData = await readRelationData('table', client, config);
      expect(tableData.length).toBe(1);
    });
  },
  Infinity,
);
