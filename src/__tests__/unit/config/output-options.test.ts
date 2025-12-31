import { describe, test, expect } from 'vitest';
import { outputOptions } from '../../../config/output-options';
import { ZodError } from 'zod';

describe('outputOptions', () => {
  test('writeToDisk is set to true by default.', () => {
    const parsedOptions = outputOptions.parse({
      outFile: '',
    });

    expect(parsedOptions.writeToDisk).toBe(true);
  });

  test('outFile is required when writeToDisk is true.', () => {
    const validOptions = {
      writeToDisk: true,
      outFile: '',
    };

    const invalidOptions = {
      ...validOptions,
      outFile: undefined,
    };

    expect(() => outputOptions.parse(validOptions)).not.toThrow(ZodError);
    expect(() => outputOptions.parse(invalidOptions)).toThrow(ZodError);
  });

  test('outFile is not allowed when writeToDisk is false.', () => {
    const validOptions = {
      writeToDisk: false,
    };

    const invalidOptions = {
      ...validOptions,
      outFile: '',
    };

    expect(() => outputOptions.parse(validOptions)).not.toThrow(ZodError);
    expect(() => outputOptions.parse(invalidOptions)).toThrow(ZodError);
  });
});
