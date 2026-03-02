import { describe, test, expect } from 'vitest';
import { shouldIncludeOverload } from '../../../../introspection/functions/should-include-overload';
import {
  introspeqlConfigSchema,
  type IntrospeQLConfig,
} from '../../../../config';
import { Directives } from '../../../../comments';

describe('shoudlIncludeOverload', () => {
  const schema = 'public';
  const functionName = 'st_distance';

  test(`It returns true if config.functions.mode is "inclusive" and neither the 
  function itself not the overload are marked for exclusion.`, () => {
    const rawConfig: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      functions: {
        mode: 'inclusive',
      },
    };

    const config = introspeqlConfigSchema.parse(rawConfig);

    expect(shouldIncludeOverload(schema, functionName, null, config)).toBe(
      true,
    );
  });

  test(`It returns false if config.functions.mode is "inclusive" but the 
  function is marked for exclusion.`, () => {
    const rawConfig: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      functions: {
        mode: 'inclusive',
        excludeFunctions: [
          {
            schema,
            name: functionName,
          },
        ],
      },
    };

    const config = introspeqlConfigSchema.parse(rawConfig);

    expect(shouldIncludeOverload(schema, functionName, null, config)).toBe(
      false,
    );
  });

  test(`It returns false if config.functions.mode is "inclusive" but the 
  overload is marked for exclusion.`, () => {
    const rawConfig: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      functions: {
        mode: 'inclusive',
      },
    };

    const config = introspeqlConfigSchema.parse(rawConfig);

    expect(
      shouldIncludeOverload(schema, functionName, Directives.Exclude, config),
    ).toBe(false);
  });

  test(`It returns false if config.functions.mode is "exclusive" and neither the 
  function itself not the overload are marked for inclusion.`, () => {
    const rawConfig: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      functions: {
        mode: 'exclusive',
      },
    };

    const config = introspeqlConfigSchema.parse(rawConfig);

    expect(shouldIncludeOverload(schema, functionName, null, config)).toBe(
      false,
    );
  });

  test(`It returns true if config.functions.mode is "exclusive" but the 
  function is marked for inclusion.`, () => {
    const rawConfig: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      functions: {
        mode: 'exclusive',
        includeFunctions: [
          {
            schema,
            name: functionName,
          },
        ],
      },
    };

    const config = introspeqlConfigSchema.parse(rawConfig);

    expect(shouldIncludeOverload(schema, functionName, null, config)).toBe(
      true,
    );
  });

  test(`It returns true if config.functions.mode is "exclusive" but the 
  overload is marked for inclusion.`, () => {
    const rawConfig: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      functions: {
        mode: 'exclusive',
      },
    };

    const config = introspeqlConfigSchema.parse(rawConfig);

    expect(
      shouldIncludeOverload(schema, functionName, Directives.Include, config),
    ).toBe(true);
  });
});
