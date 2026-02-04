import { capitalize } from './capitalize';

/**
 * Converts a PostgreSQL identifier to a valid TypeScript identifier.
 *
 * @remarks
 * In PostgreSQL, if an identifier is enclosed in double quotes, it can include
 * a wider selection of characters than are valid in TypeScript.
 * Additionally, while it is idiomatic to use snake_case in PostgreSQL, it is
 * more commonplace to use PascalCase for TypeScript types. Therefore, the
 * following rules are followed when converting identifiers:
 *
 * - If the PostgreSQL identifier begins with underscore(s), these are
 *   preserved.
 * - Otherwise, only alphanumeric and $ characters are copied.
 * - All non-letter characters are treated as separators, except for
 *   apostrophes, which are simply discarded.
 * - Each word (i.e. the letters between separators) is capitalized.
 * - If the result begins with a number, it is prefaced with an underscore.
 */
export function convertPGIdentifierToTSIdentifier(identifier: string) {
  // preserve leading underscores
  let prefix = '';

  while (identifier.startsWith('_')) {
    prefix += '_';
    identifier = identifier.slice(1);
  }

  const words = [];
  let word = '';

  for (const char of identifier) {
    if (char === "'") continue;

    if (/[^A-Za-z]/.test(char)) {
      if (word.length) words.push(word);
      if (/[0-9$]/.test(char)) {
        words.push(char);
      }
      word = '';
    } else {
      word += char;
    }
  }

  if (word.length) {
    words.push(word);
  }

  let result = prefix + words.map(word => capitalize(word)).join('');
  if (/^\d/.test(result)) result = '_' + result;
  return result;
}
