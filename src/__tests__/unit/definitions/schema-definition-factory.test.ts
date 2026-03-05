import { describe, beforeAll, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { PostgresMock } from 'pgmock';
import { Client } from 'pg';
import {
  SchemaDefinitionFactory,
  SchemaDefinition,
  RelationDefinition,
  ColumnDefinition,
  ColumnTypeDefinition,
  EnumDefinition,
  FunctionDefinition,
  FunctionOverloadDefinition,
  FunctionParameterDefinition,
  FunctionReturnTypeDefinition,
} from '../../../definitions';
import { introspeqlConfigSchema, type IntrospeQLConfig } from '../../../config';
import { readSchemaData, type SchemaData } from '../../../introspection';
import { sortByPGName } from '../../../shared';

describe('SchemaDefinitionFactory', () => {
  let schemaData: Record<string, SchemaData>;
  let baseConfig: IntrospeQLConfig;

  beforeAll(async () => {
    const database = await PostgresMock.create();
    const client = new Client(database.getNodePostgresConfig());
    await client.connect();

    const sql = await fs.readFile(
      path.join(import.meta.dirname, './schema.sql'),
      'utf-8',
    );

    await client.query(sql);

    baseConfig = {
      dbConnectionParams: database.getNodePostgresConfig(),
      schemas: ['public', 'auth'],
      writeToDisk: false,
    };

    const parsedConfig = introspeqlConfigSchema.parse(baseConfig);
    schemaData = await readSchemaData(client, parsedConfig);
    await client.end();
    database.destroy();
  }, Infinity);

  it('creates a schema definition, copying comments by default.', () => {
    const config: IntrospeQLConfig = {
      ...baseConfig,
      copyComments: true,
    };

    const parsedConfig = introspeqlConfigSchema.parse(config);

    const schemaDefinitions = sortByPGName(
      Object.values(schemaData).map(schemaData => {
        return SchemaDefinitionFactory.createSchemaDefinition(
          schemaData,
          parsedConfig,
        );
      }),
    );

    const expected = [
      new SchemaDefinition(
        'auth',
        [
          new RelationDefinition('user', undefined, [
            new ColumnDefinition(
              'created_at',
              undefined,
              new ColumnTypeDefinition('Date', 0, false, 'by_default'),
            ),
            new ColumnDefinition(
              'email',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'first_name',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'id',
              undefined,
              new ColumnTypeDefinition('number', 0, false, 'always'),
            ),
            new ColumnDefinition(
              'last_name',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'middle_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'password',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'updated_at',
              undefined,
              new ColumnTypeDefinition('Date', 0, false, 'by_default'),
            ),
            new ColumnDefinition(
              'user_role',
              undefined,
              new ColumnTypeDefinition(
                {
                  enumName: 'role',
                  enumSchema: 'auth',
                },
                0,
                false,
                'by_default',
              ),
            ),
          ]),
        ],
        [],
        [],
        [],
        [
          new EnumDefinition('role', undefined, [
            'user',
            'admin',
            'superadmin',
            'owner',
          ]),
        ],
      ),
      new SchemaDefinition(
        'public',
        [
          new RelationDefinition(
            'comments_allowed_according_to_settings',
            '/** Test comment */',
            [
              new ColumnDefinition(
                'comment_allowed_according_to_table_settings',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_allowed',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_disallowed',
                undefined,
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
            ],
          ),
          new RelationDefinition(
            'comments_explicitly_allowed',
            '/** Test comment */',
            [
              new ColumnDefinition(
                'comment_allowed_according_to_table_settings',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_allowed',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_disallowed',
                undefined,
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
            ],
          ),
          new RelationDefinition('comments_explicitly_disallowed', undefined, [
            new ColumnDefinition(
              'comment_allowed_according_to_table_settings',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'comment_explicitly_allowed',
              '/** Test comment */',
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'comment_explicitly_disallowed',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
          ]),
        ],
        [
          new RelationDefinition('user', undefined, [
            new ColumnDefinition(
              'email',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'first_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'id',
              undefined,
              new ColumnTypeDefinition('number', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'last_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'middle_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'user_role',
              undefined,
              new ColumnTypeDefinition(
                {
                  enumName: 'role',
                  enumSchema: 'auth',
                },
                0,
                true,
                'never',
              ),
            ),
          ]),
        ],
        [
          new RelationDefinition('first_generation_user', undefined, [
            new ColumnDefinition(
              'created_at',
              undefined,
              new ColumnTypeDefinition('Date', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'email',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'id',
              undefined,
              new ColumnTypeDefinition('number', 0, true, 'never'),
            ),
          ]),
        ],
        [
          new FunctionDefinition('get_user_role', [
            new FunctionOverloadDefinition(
              [
                new FunctionParameterDefinition(
                  'number',
                  false,
                  false,
                  false,
                  false,
                ),
              ],
              new FunctionReturnTypeDefinition(
                {
                  enumName: 'role',
                  enumSchema: 'auth',
                },
                false,
                true,
              ),
            ),
          ]),
        ],
        [],
      ),
    ];

    expect(schemaDefinitions).toStrictEqual(expected);
  });

  it('creates a schema definition, omitting comments by default.', () => {
    const config: IntrospeQLConfig = {
      ...baseConfig,
      copyComments: false,
    };

    const parsedConfig = introspeqlConfigSchema.parse(config);

    const schemaDefinitions = sortByPGName(
      Object.values(schemaData).map(schemaData => {
        return SchemaDefinitionFactory.createSchemaDefinition(
          schemaData,
          parsedConfig,
        );
      }),
    );

    const expected = [
      new SchemaDefinition(
        'auth',
        [
          new RelationDefinition('user', undefined, [
            new ColumnDefinition(
              'created_at',
              undefined,
              new ColumnTypeDefinition('Date', 0, false, 'by_default'),
            ),
            new ColumnDefinition(
              'email',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'first_name',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'id',
              undefined,
              new ColumnTypeDefinition('number', 0, false, 'always'),
            ),
            new ColumnDefinition(
              'last_name',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'middle_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'password',
              undefined,
              new ColumnTypeDefinition('string', 0, false, 'never'),
            ),
            new ColumnDefinition(
              'updated_at',
              undefined,
              new ColumnTypeDefinition('Date', 0, false, 'by_default'),
            ),
            new ColumnDefinition(
              'user_role',
              undefined,
              new ColumnTypeDefinition(
                {
                  enumName: 'role',
                  enumSchema: 'auth',
                },
                0,
                false,
                'by_default',
              ),
            ),
          ]),
        ],
        [],
        [],
        [],
        [
          new EnumDefinition('role', undefined, [
            'user',
            'admin',
            'superadmin',
            'owner',
          ]),
        ],
      ),
      new SchemaDefinition(
        'public',
        [
          new RelationDefinition(
            'comments_allowed_according_to_settings',
            undefined,
            [
              new ColumnDefinition(
                'comment_allowed_according_to_table_settings',
                undefined,
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_allowed',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_disallowed',
                undefined,
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
            ],
          ),
          new RelationDefinition(
            'comments_explicitly_allowed',
            '/** Test comment */',
            [
              new ColumnDefinition(
                'comment_allowed_according_to_table_settings',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_allowed',
                '/** Test comment */',
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
              new ColumnDefinition(
                'comment_explicitly_disallowed',
                undefined,
                new ColumnTypeDefinition('string', 0, true, 'never'),
              ),
            ],
          ),
          new RelationDefinition('comments_explicitly_disallowed', undefined, [
            new ColumnDefinition(
              'comment_allowed_according_to_table_settings',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'comment_explicitly_allowed',
              '/** Test comment */',
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'comment_explicitly_disallowed',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
          ]),
        ],
        [
          new RelationDefinition('user', undefined, [
            new ColumnDefinition(
              'email',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'first_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'id',
              undefined,
              new ColumnTypeDefinition('number', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'last_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'middle_name',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'user_role',
              undefined,
              new ColumnTypeDefinition(
                {
                  enumName: 'role',
                  enumSchema: 'auth',
                },
                0,
                true,
                'never',
              ),
            ),
          ]),
        ],
        [
          new RelationDefinition('first_generation_user', undefined, [
            new ColumnDefinition(
              'created_at',
              undefined,
              new ColumnTypeDefinition('Date', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'email',
              undefined,
              new ColumnTypeDefinition('string', 0, true, 'never'),
            ),
            new ColumnDefinition(
              'id',
              undefined,
              new ColumnTypeDefinition('number', 0, true, 'never'),
            ),
          ]),
        ],
        [
          new FunctionDefinition('get_user_role', [
            new FunctionOverloadDefinition(
              [
                new FunctionParameterDefinition(
                  'number',
                  false,
                  false,
                  false,
                  false,
                ),
              ],
              new FunctionReturnTypeDefinition(
                {
                  enumName: 'role',
                  enumSchema: 'auth',
                },
                false,
                true,
              ),
            ),
          ]),
        ],
        [],
      ),
    ];

    expect(schemaDefinitions).toStrictEqual(expected);
  });
});
