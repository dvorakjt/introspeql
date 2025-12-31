import { describe, it, expect } from 'vitest';
import { shouldIncludeFunction } from '../../../functions/should-include-function';
import type { FunctionData } from '../../../functions/function-data';

describe('shouldIncludeFunction', () => {
  it('returns true if any overloads were included.', () => {
    const functionData: FunctionData = {
      schema: 'public',
      name: 'st_distance',
      overloads: [
        {
          paramTypes: [],
          returnType: {
            oid: 2278,
            schema: 'pg_catalog',
            name: 'void',
            isEnum: false,
            isArray: false,
          },
          comment: null,
        },
      ],
    };

    expect(shouldIncludeFunction(functionData)).toBe(true);
  });

  it('returns false if no overloads were included.', () => {
    const functionData: FunctionData = {
      schema: 'public',
      name: 'st_distance',
      overloads: [],
    };

    expect(shouldIncludeFunction(functionData)).toBe(false);
  });
});
