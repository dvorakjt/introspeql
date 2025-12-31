import { describe, it, expect, vi } from 'vitest';
import { CommentConverter, prettifyComment } from '../../../comments';
import { Directives, ParsingError } from '../../../shared';
import { faker } from '@faker-js/faker';

function applyFormatting(paragraphs: string[]) {
  return prettifyComment(
    '/**\n' +
      paragraphs
        .map(p =>
          p
            .split('\n')
            .map(p => ' * ' + p)
            .join('\n'),
        )
        .join('\n *\n') +
      '\n */',
  );
}

describe('CommentConverter.convertComment', () => {
  it('returns the whole comment if no directive is included.', () => {
    const comment = faker.lorem.paragraphs(3);
    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting([comment]);
    expect(actual).toBe(expected);
  });

  it(`returns an excerpt of the comment beginning after ${Directives.BeginTSDocComment}.`, () => {
    const excluded = faker.lorem.paragraph();
    const included = faker.lorem.paragraph();
    const comment =
      excluded + '\n' + Directives.BeginTSDocComment + '\n' + included;

    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting([included]);
    expect(actual).toBe(expected);
  });

  it(`returns an excerpt of the comment up to ${Directives.EndTSDocComment}.`, () => {
    const included = faker.lorem.paragraph();
    const excluded = faker.lorem.paragraph();
    const comment =
      included + '\n' + Directives.EndTSDocComment + '\n' + excluded;

    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting([included]);
    expect(actual).toBe(expected);
  });

  it(`returns excerpts before ${Directives.EndTSDocComment} and after ${Directives.BeginTSDocComment}.`, () => {
    const included = [
      faker.lorem.paragraph(),
      faker.lorem.paragraph(),
      faker.lorem.paragraph(),
    ];

    const excluded = [faker.lorem.paragraph(), faker.lorem.paragraph()];

    const comment = [
      included[0],
      Directives.EndTSDocComment,
      excluded[0],
      Directives.BeginTSDocComment,
      included[1],
      Directives.EndTSDocComment,
      excluded[1],
      Directives.BeginTSDocComment,
      included[2],
    ].join('\n');

    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting(included);
    expect(actual).toBe(expected);
  });

  it('recognizes directives regardless of case.', () => {
    const included = [
      faker.lorem.paragraph(),
      faker.lorem.paragraph(),
      faker.lorem.paragraph(),
    ];

    const excluded = [faker.lorem.paragraph(), faker.lorem.paragraph()];

    const comment = [
      included[0],
      Directives.EndTSDocComment.toUpperCase(),
      excluded[0],
      Directives.BeginTSDocComment.toUpperCase(),
      included[1],
      Directives.EndTSDocComment.toUpperCase(),
      excluded[1],
      Directives.BeginTSDocComment.toUpperCase(),
      included[2],
    ].join('\n');

    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting(included);
    expect(actual).toBe(expected);
  });

  it('throws a parsing error if two of the same directive appear in a row.', () => {
    const invalidComments = [
      Directives.BeginTSDocComment + ' ' + Directives.BeginTSDocComment,
      Directives.EndTSDocComment + '\n' + Directives.EndTSDocComment,
    ];

    for (const comment of invalidComments) {
      expect(() => CommentConverter.convertComment(comment)).toThrow(
        ParsingError,
      );
    }
  });

  it('throws an error when it attempts to convert a potentially malicious comment.', () => {
    const evilFunction = vi.fn();
    const evilComment = '*/ evilFunction() /*';
    const withoutValidation = applyFormatting([evilComment]);
    eval(withoutValidation);
    expect(evilFunction).toHaveBeenCalled();
    expect(() => CommentConverter.convertComment(evilComment)).toThrow(
      ParsingError,
    );
  });

  it('returns empty strings for empty comments and comments consisting only of directives.', () => {
    const comments = [
      '',
      Directives.BeginTSDocComment,
      Directives.EndTSDocComment,
      Directives.BeginTSDocComment + ' ' + Directives.EndTSDocComment,
      Directives.EndTSDocComment + ' ' + Directives.BeginTSDocComment,
      Directives.EndTSDocComment +
        ' ' +
        Directives.BeginTSDocComment +
        '\n' +
        Directives.EndTSDocComment +
        '\t' +
        Directives.BeginTSDocComment,
    ];

    for (const comment of comments) {
      expect(CommentConverter.convertComment(comment)).toBe('');
    }
  });

  it('does not recognize directives that are not separated by spaces or new lines.', () => {
    const comment = faker.lorem.sentence() + Directives.BeginTSDocComment;
    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting([comment]);
    expect(actual).toBe(expected);
  });

  it('removes introspeql directives from the output.', () => {
    const lines = [
      'Directives can help you control how IntrospeQL interacts with your database. This is a very long line spanning many more than 80 characters!\n',
      '```',
      'const dbTypes = await introspeql(client, config)',
      '```\n',
      'After calling introspeql, you will get a full list of all types found in your database.',
    ];

    // randomly add a directive to each line
    const linesWithDirectives = lines.map(line => {
      const possibleIndices = [
        0,
        ...line
          .split('')
          .map((c, i) => {
            return { char: c, index: i };
          })
          .filter(({ char }) => char === ' ')
          .map(({ index }) => index + 1),
      ];

      /*
        If the line were to end with a directive following a new line, that 
        new line character would be collapsed because lines containing only 
        directives are removed.
      */
      if (!line.endsWith('\n')) {
        possibleIndices.push(line.length);
      }

      const directive = faker.helpers.arrayElement(
        Object.values(Directives).filter(directive => {
          return (
            directive !== Directives.BeginTSDocComment &&
            directive !== Directives.EndTSDocComment
          );
        }),
      );

      const insertAt = faker.helpers.arrayElement(possibleIndices);

      return (
        line.slice(0, insertAt) +
        (insertAt < line.length ? directive + ' ' : ' ' + directive) +
        line.slice(insertAt)
      );
    });

    const comment = linesWithDirectives.join('\n');
    const commentWithoutDirectives = lines.join('\n');
    const actual = CommentConverter.convertComment(comment);
    const expected = applyFormatting([commentWithoutDirectives]);
    expect(actual).toBe(expected);
  });
});
