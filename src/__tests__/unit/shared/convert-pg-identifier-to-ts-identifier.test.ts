import { describe, test, expect } from 'vitest';
import { convertPGIdentifierToTSIdentifier } from '../../../shared';

describe('convertPGIdentifierToTSIdentifier', () => {
  test('various conversions', () => {
    const conversions = [
      ['snake_case_identifier', 'SnakeCaseIdentifier'],
      ['_prefixed_with_1_underscore', '_PrefixedWith1Underscore'],
      ['__prefixed_with_underscores', '__PrefixedWithUnderscores'],
      ['separated-with-hyphens', 'SeparatedWithHyphens'],
      ['separated with spaces', 'SeparatedWithSpaces'],
      ['separated.with.dots', 'SeparatedWithDots'],
      [
        'separated--with... various\n_separators',
        'SeparatedWithVariousSeparators',
      ],
      ['contains1number', 'Contains1Number'],
      [
        '(contains [a lot] of invalid characters !?)',
        'ContainsALotOfInvalidCharacters',
      ],
      ['$contains_dollar_signs$', '$ContainsDollarSigns$'],
      ["an apostrophe's skipped", 'AnApostrophesSkipped'],
    ];

    for (const [pgIdentifier, expectedResult] of conversions) {
      expect(convertPGIdentifierToTSIdentifier(pgIdentifier)).toBe(
        expectedResult,
      );
    }
  });
});
