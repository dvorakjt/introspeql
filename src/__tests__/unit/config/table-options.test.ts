import { describe, it, test, expect } from 'vitest';
import { tableOptions } from '../../../config/table-options';
import { ZodError } from 'zod';

describe('tableOptions', () => {
  it('defaults to inclusive-mode when no mode is specified.', () => {
    const parsedOptions = tableOptions.parse({});
    expect(parsedOptions.mode).toBe('inclusive');
  });

  test('exludeTables defaults to an empty array when mode is inclusive.', () => {
    const parsedOptions = tableOptions.parse({});

    if (parsedOptions.mode !== 'inclusive') {
      throw new Error('mode was not correctly set.');
    }

    expect(parsedOptions.excludeTables).toStrictEqual([]);
  });

  test('includeTables defaults to an empty array when mode is exlusive.', () => {
    const parsedOptions = tableOptions.parse({
      mode: 'exclusive',
    });

    if (parsedOptions.mode !== 'exclusive') {
      throw new Error('mode was not correctly set.');
    }

    expect(parsedOptions.includeTables).toStrictEqual([]);
  });

  test('includeTables is not permitted when mode is inclusive.', () => {
    const validOptions = {
      mode: 'inclusive',
      excludeTables: [],
    };

    const invalidOptions = {
      ...validOptions,
      includeTables: [],
    };

    expect(() => tableOptions.parse(validOptions)).not.toThrow(ZodError);
    expect(() => tableOptions.parse(invalidOptions)).toThrow(ZodError);
  });
});
