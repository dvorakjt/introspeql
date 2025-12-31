import { describe, it, expect } from 'vitest';
import { lookupType } from '../../../types';
import { introspeqlConfigSchema, type IntrospeQLConfig } from '../../../config';

describe('lookupType', () => {
  it('returns the value declared in config.types is the corresponding key is present.', () => {
    const typeInformation = {
      schema: 'pg_catalog',
      name: 'bool',
      isEnum: false,
    };

    const tsType = 'boolean';

    const config: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
      types: {
        [`${typeInformation.schema}.${typeInformation.name}`]: tsType,
      },
    };

    const parsedConfig = introspeqlConfigSchema.parse(config);
    expect(lookupType(typeInformation, 'public', parsedConfig)).toBe(tsType);
  });

  it('returns an enum definition when the type is an enum and is not included in config.types.', () => {
    const typeInformation = {
      schema: 'public',
      name: 'cardinal_directions',
      isEnum: true,
    };

    const tsType = 'Enums.CardinalDirections';

    const config: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
    };

    const parsedConfig = introspeqlConfigSchema.parse(config);

    expect(
      lookupType(typeInformation, typeInformation.schema, parsedConfig),
    ).toBe(tsType);
  });

  it('includes the schema name for enums not defined in the parent schema.', () => {
    const typeInformation = {
      schema: 'geographic_information',
      name: 'cardinal_directions',
      isEnum: true,
    };

    const tsType = 'GeographicInformation.Enums.CardinalDirections';

    const config: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
    };

    const parsedConfig = introspeqlConfigSchema.parse(config);

    expect(lookupType(typeInformation, 'public', parsedConfig)).toBe(tsType);
  });

  it("returns 'string' if the type cannot be found.", () => {
    const typeInformation = {
      schema: 'pg_catalog',
      name: 'varchar',
      isEnum: false,
    };

    const config: IntrospeQLConfig = {
      dbConnectionString: '',
      writeToDisk: false,
    };

    const parsedConfig = introspeqlConfigSchema.parse(config);
    expect(lookupType(typeInformation, 'public', parsedConfig)).toBe('string');
  });
});
