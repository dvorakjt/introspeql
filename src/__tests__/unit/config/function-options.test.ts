import { describe, test, expect } from 'vitest';
import { functionOptions } from '../../../config/function-options';
import { ZodError } from 'zod';

describe('functionOptions', () => {
  test('default values are provided for omitted properties.', () => {
    expect(functionOptions.parse({})).toEqual({
      mode: 'inclusive',
      excludeFunctions: [],
      nullableArgs: false,
      nullableReturnTypes: true,
    });
  });

  test('when mode is inclusive, includeFunctions cannot be present.', () => {
    const valid = {
      mode: 'inclusive',
    };

    const invalid = {
      ...valid,
      includeFunctions: [],
    };

    expect(() => functionOptions.parse(valid)).not.toThrow(ZodError);
    expect(() => functionOptions.parse(invalid)).toThrow(ZodError);
  });

  test('when mode is exclusive, exludeFunctions cannot be present.', () => {
    const valid = {
      mode: 'exclusive',
    };

    const invalid = {
      ...valid,
      excludeFunctions: [],
    };

    expect(() => functionOptions.parse(valid)).not.toThrow(ZodError);
    expect(() => functionOptions.parse(invalid)).toThrow(ZodError);
  });
});
