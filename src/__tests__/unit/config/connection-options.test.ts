import { describe, test, expect } from 'vitest';
import { connectionOptions } from '../../../config/connection-options';
import { ZodError } from 'zod';

describe('connectionOptions', () => {
  test('dbConnectionString and dbConnectionParams are not allowed together.', () => {
    const validConnectionString = {
      dbConnectionString: '',
    };

    const validConnectionParams = {
      dbConnectionParams: {},
    };

    const invalidOptions = {
      ...validConnectionString,
      ...validConnectionParams,
    };

    expect(() => connectionOptions.parse(validConnectionString)).not.toThrow(
      ZodError,
    );

    expect(() => connectionOptions.parse(validConnectionParams)).not.toThrow(
      ZodError,
    );

    expect(() => connectionOptions.parse(invalidOptions)).toThrow(ZodError);
  });
});
