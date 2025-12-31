import { describe, it, expect } from 'vitest';
import { EnumDefinition } from '../../../enums';

describe('EnumDefinition', () => {
  it('returns a union containing enum members.', () => {
    const pgEnumName = 'cardinal_directions';
    const enumMembers = ['north', 'south', 'east', 'west'];
    const enumDefinition = new EnumDefinition(pgEnumName, enumMembers);
    expect(enumDefinition.toString()).toBe(
      `export type CardinalDirections = |
  'north' |
  'south' |
  'east' |
  'west';`,
    );
  });

  it('correctly handles empty enums.', () => {
    expect(new EnumDefinition('empty_enum', []).toString()).toBe(
      'export type EmptyEnum = never;',
    );
  });

  it('applies a TSDoc comment.', () => {
    const pgEnumName = 'cardinal_directions';
    const enumMembers = ['north', 'south', 'east', 'west'];
    const tsDocComment = '/**\n * The four main points on a compass.\n */';
    const enumDefinition = new EnumDefinition(
      pgEnumName,
      enumMembers,
      tsDocComment,
    );

    expect(enumDefinition.toString()).toBe(
      `/**
 * The four main points on a compass.
 */
export type CardinalDirections = |
  'north' |
  'south' |
  'east' |
  'west';`,
    );
  });
});
