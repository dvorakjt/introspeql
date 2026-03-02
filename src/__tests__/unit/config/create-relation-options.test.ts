import { describe, test, expect } from 'vitest';
import { createRelationOptions } from '../../../config/create-relation-options';
import { capitalize } from '../../../shared/capitalize';

describe('createRelationOptions', () => {
  const relations = ['table', 'view', 'materializedView'] as const;

  test('the object it returns defaults to inclusive mode for each relation type.', () => {
    for (const relation of relations) {
      const options = createRelationOptions(relation);
      const parsedOptions = options.parse({});
      expect(parsedOptions.mode).toBe('inclusive');
    }
  });

  test('exclude<relationName> defaults to an empty array when mode is inclusive.', () => {
    for (const relation of relations) {
      const options = createRelationOptions(relation);
      const parsedOptions = options.parse({
        mode: 'inclusive',
      });

      expect(parsedOptions[`exclude${capitalize(relation)}s`]).toStrictEqual(
        [],
      );
    }
  });

  test('include<relationName> defaults to an empty array when mode is exclusive.', () => {
    for (const relation of relations) {
      const options = createRelationOptions(relation);
      const parsedOptions = options.parse({
        mode: 'exclusive',
      });

      expect(parsedOptions[`include${capitalize(relation)}s`]).toStrictEqual(
        [],
      );
    }
  });

  test('include<relationName> is only permitted when mode is exclusive.', () => {
    for (const relation of relations) {
      const options = createRelationOptions(relation);
      const validInput = {
        mode: 'exclusive',
        [`include${capitalize(relation)}s`]: [],
      };

      const invalidInput = {
        ...validInput,
        mode: 'inclusive',
      };

      expect(options.safeParse(validInput).success).toBe(true);
      expect(options.safeParse(invalidInput).success).toBe(false);
    }
  });

  test('exclude<relationName> is only permitted when mode is inclusive.', () => {
    for (const relation of relations) {
      const options = createRelationOptions(relation);
      const validInput = {
        mode: 'inclusive',
        [`exclude${capitalize(relation)}s`]: [],
      };

      const invalidInput = {
        ...validInput,
        mode: 'exclusive',
      };

      expect(options.safeParse(validInput).success).toBe(true);
      expect(options.safeParse(invalidInput).success).toBe(false);
    }
  });
});
