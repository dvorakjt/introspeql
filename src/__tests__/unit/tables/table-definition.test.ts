import { describe, it, expect } from 'vitest';
import { TableDefinition, ColumnDefinition } from '../../../tables';
import { ColumnTypeDefinition } from '../../../tables';

describe('TableDefinition', () => {
  it('creates a table definition.', () => {
    const PGTableName = 'users';

    const columns = [
      new ColumnDefinition('id', new ColumnTypeDefinition('number', 0, false)),
      new ColumnDefinition(
        'first_name',
        new ColumnTypeDefinition('string', 0, false),
      ),
      new ColumnDefinition(
        'middle_name',
        new ColumnTypeDefinition('string', 0, true),
      ),
      new ColumnDefinition(
        'last_name',
        new ColumnTypeDefinition('string', 0, false),
      ),
      new ColumnDefinition(
        'permissions',
        new ColumnTypeDefinition('string', 1, false),
      ),
    ];

    const tableDefinition = new TableDefinition(PGTableName, columns);

    expect(tableDefinition.toString()).toBe(
      `export namespace Users {
  export const PGTableName = 'users';

  export type ColumnNames = |
    'id' |
    'first_name' |
    'middle_name' |
    'last_name' |
    'permissions';

  export interface RowType {
    ['id']: number;
    ['first_name']: string;
    ['middle_name']: string | null;
    ['last_name']: string;
    ['permissions']: string[];
  }
}`,
    );
  });

  it('applies TSDoc comments to the table and columns.', () => {
    const PGTableName = 'users';
    const tableLevelComment =
      '/**\n * A table that contains information about users.\n */';
    const columnLevelComment =
      '/**\n * A unique identifier. Increments automatically.\n */';
    const columns = [
      new ColumnDefinition(
        'id',
        new ColumnTypeDefinition('number', 0, false),
        columnLevelComment,
      ),
    ];

    const tableDefinition = new TableDefinition(
      PGTableName,
      columns,
      tableLevelComment,
    );

    expect(tableDefinition.toString()).toBe(
      `/**
 * A table that contains information about users.
 */
export namespace Users {
  export const PGTableName = 'users';

  export type ColumnNames = |
    'id';

  export interface RowType {
    /**
     * A unique identifier. Increments automatically.
     */
    ['id']: number;
  }
}`,
    );
  });

  it('creates valid typescript types from a table that has no columns.', () => {
    const PGTableName = 'empty_table';
    const tableDefinition = new TableDefinition(PGTableName, []);

    expect(tableDefinition.toString()).toBe(
      `export namespace EmptyTable {
  export const PGTableName = 'empty_table';

  export type ColumnNames = never;

  export interface RowType {}
}`,
    );
  });
});
