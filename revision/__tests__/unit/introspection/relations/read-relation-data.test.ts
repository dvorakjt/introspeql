import { describe, beforeEach, afterEach, it, test, expect } from 'vitest';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import { faker } from '@faker-js/faker';
import { readRelationData } from '../../../../introspection/relations';
import {
  introspeqlConfigSchema,
  type IntrospeQLConfig,
  type ParsedConfig,
} from '../../../../config';
import { Directives } from '../../../../comments';

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

    it('reads table data from the database.', async () => {
      const tableNames = ['books', 'authors', 'publishers'];

      for (const tableName of tableNames) {
        await client.query(`CREATE TABLE ${tableName} ();`);
      }

      const tableData = await readRelationData('table', client, config);

      for (const tableName of tableNames) {
        expect(tableData.some(td => td.name === tableName)).toBe(true);
      }
    });

    it('reads comments on tables.', async () => {
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

    it('reads view data from the database.', async () => {
      await client.query(`CREATE TABLE products (
        id SERIAL PRIMARY KEY, 
        product_name VARCHAR(255) UNIQUE NOT NULL, 
        categories VARCHAR(255)[] NOT NULL,
        total_units_sold INTEGER NOT NULL,
        unit_price DECIMAL NOT NULL
      );`);

      const viewName = 'best_selling_products';
      await client.query(`CREATE VIEW ${viewName} AS 
        SELECT * FROM products 
        ORDER BY total_units_sold * unit_price
        LIMIT 10;
      `);

      const comment = 'The top 10 best-selling products by total earnings.';
      await client.query(`COMMENT ON VIEW ${viewName} IS '${comment}';`);

      const viewData = await readRelationData('view', client, config);
      expect(viewData[0]).toEqual(
        expect.objectContaining({
          name: viewName,
          comment,
        }),
      );
    });

    it('reads materialized view data from the database.', async () => {
      await client.query(`CREATE TABLE products (
        id SERIAL PRIMARY KEY, 
        product_name VARCHAR(255) UNIQUE NOT NULL, 
        categories VARCHAR(255)[] NOT NULL,
        total_units_sold INTEGER NOT NULL,
        unit_price DECIMAL NOT NULL
      );`);

      const materializedViewName = 'best_selling_products';
      await client.query(`CREATE MATERIALIZED VIEW ${materializedViewName} AS 
        SELECT * FROM products 
        ORDER BY total_units_sold * unit_price
        LIMIT 10;
      `);

      const comment = 'The top 10 best-selling products by total earnings.';
      await client.query(
        `COMMENT ON MATERIALIZED VIEW ${materializedViewName} IS '${comment}';`,
      );

      const materializedViewData = await readRelationData(
        'materializedView',
        client,
        config,
      );

      expect(materializedViewData[0]).toEqual(
        expect.objectContaining({
          name: materializedViewName,
          comment,
        }),
      );
    });
  },
  Infinity,
);
