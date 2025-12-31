import { describe, test, expect } from 'vitest';
import { shouldIncludeTable } from '../../../tables';
import { Directives } from '../../../shared';

describe('shouldIncludeTable', () => {
  test('if mode is inclusive, it returns true.', () => {
    const includeEntity = shouldIncludeTable({
      name: '',
      schema: '',
      comment: null,
      mode: 'inclusive',
      exceptions: [],
    });

    expect(includeEntity).toBe(true);
  });

  test('if mode is exclusive, it returns false.', () => {
    const includeEntity = shouldIncludeTable({
      name: '',
      schema: '',
      comment: null,
      mode: 'exclusive',
      exceptions: [],
    });

    expect(includeEntity).toBe(false);
  });

  test('if mode is inclusive, but the comment includes the exclude directive, it returns false.', () => {
    const includeEntity = shouldIncludeTable({
      name: '',
      schema: '',
      comment: `${Directives.Exclude}`,
      mode: 'inclusive',
      exceptions: [],
    });

    expect(includeEntity).toBe(false);
  });

  test('if mode is inclusive, but exceptions contains the schema and name of the entity, it returns false.', () => {
    const schemaName = 'public';
    const tableName = 'users';

    const includeEntity = shouldIncludeTable({
      name: tableName,
      schema: schemaName,
      comment: null,
      mode: 'inclusive',
      exceptions: [
        {
          schema: schemaName,
          name: tableName,
        },
      ],
    });

    expect(includeEntity).toBe(false);
  });

  test('if mode is exclusive, but the comment includes the include directive, it returns true.', () => {
    const includeEntity = shouldIncludeTable({
      name: '',
      schema: '',
      comment: `${Directives.Include}`,
      mode: 'exclusive',
      exceptions: [],
    });

    expect(includeEntity).toBe(true);
  });

  test('if mode is exclusive, but exceptions contains the schema and name of the entity, it returns true.', () => {
    const schemaName = 'public';
    const tableName = 'users';

    const includeEntity = shouldIncludeTable({
      name: tableName,
      schema: schemaName,
      comment: null,
      mode: 'exclusive',
      exceptions: [
        {
          schema: schemaName,
          name: tableName,
        },
      ],
    });

    expect(includeEntity).toBe(true);
  });
});
