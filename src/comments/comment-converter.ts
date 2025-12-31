import { Directives, ParsingError } from '../shared';
import { prettifyComment } from './prettify-comment';

export class CommentConverter {
  private static chunkExtractionDirectivesPattern = new RegExp(
    `(^|\\s)(${Directives.BeginTSDocComment}|${Directives.EndTSDocComment})($|\\s)`,
    'i',
  );

  private static chunkSanitizationDirectivesPattern: RegExp;

  static {
    const directivesPattern = `(${Object.values(Directives).join('|')})`;
    this.chunkSanitizationDirectivesPattern = new RegExp(
      `(^|\\s)(${directivesPattern})(\\s+${directivesPattern})*($|\\s)`,
      'gi',
    );
  }

  /**
   * Converts a PostgreSQL comment into TSDoc format, removing IntrospeQL
   * directives, and formatting, prettifying, and validating the result.
   */
  static convertComment(pgComment: string) {
    // Break the comment into chunks and sanitize them.
    const chunks = this.extractChunks(pgComment);
    const sanitizedChunks = this.sanitizeChunks(chunks);

    // Convert the comment and validate it.
    const convertedComment = this.formatAndMergeChunks(sanitizedChunks);
    this.validateComment(convertedComment);

    // Prettify the comment and validate it.
    const prettifiedComment = this.prettifyComment(convertedComment);
    this.validateComment(prettifiedComment);
    return prettifiedComment;
  }

  /**
   * Extracts the portions of a comment that have been flagged for inclusion
   * with the `@introspeql-begin-tsdoc-comment` and/or
   * `@introspeql-end-tsdoc-comment` directives, or the whole comment if no
   * such directives are present.
   */
  private static extractChunks(pgComment: string): string[] {
    const chunks: string[] = [];

    let previousDirective:
      | Directives.BeginTSDocComment
      | Directives.EndTSDocComment
      | null = null;

    let indexOfDirective = this.findNextChunkExtractionDirective(pgComment);
    let chunk = this.extractChunk(pgComment, indexOfDirective);

    while (indexOfDirective >= 0) {
      const directive = this.extractDirective(pgComment, indexOfDirective);

      if (directive === previousDirective) {
        throw new ParsingError(
          'Ambiguous directives: cannot have two instances of ' +
            directive +
            'in a row in the same comment.',
        );
      } else if (
        directive === Directives.EndTSDocComment &&
        !this.isEmptyChunk(chunk)
      ) {
        chunks.push(chunk);
      }

      pgComment = this.discardPreviousChunk(pgComment);
      indexOfDirective = this.findNextChunkExtractionDirective(pgComment);
      chunk = this.extractChunk(pgComment, indexOfDirective);
      previousDirective = directive;
    }

    if (
      (!previousDirective ||
        previousDirective === Directives.BeginTSDocComment) &&
      !this.isEmptyChunk(chunk)
    ) {
      chunks.push(chunk);
    }

    return chunks;
  }

  private static findNextChunkExtractionDirective(pgComment: string) {
    return pgComment.search(this.chunkExtractionDirectivesPattern);
  }

  private static extractChunk(pgComment: string, indexOfDirective: number) {
    return pgComment.slice(
      0,
      indexOfDirective >= 0 ? indexOfDirective : pgComment.length,
    );
  }

  /**
   * Extracts a directive from a comment at the provided index, regardless of
   * the case of the directive as it appears in the comment.
   */
  private static extractDirective(
    pgComment: string,
    indexOfDirective: number,
  ): Directives.BeginTSDocComment | Directives.EndTSDocComment {
    /*
      Add 2 to the length of the longer directive because the pattern includes 
      up to 1 leading and 1 trailing whitespace character.
    */
    const maxSearchLength =
      Math.max(
        Directives.BeginTSDocComment.length,
        Directives.EndTSDocComment.length,
      ) + 2;

    const searchString = pgComment
      .slice(indexOfDirective, indexOfDirective + maxSearchLength)
      .trim()
      .toLowerCase();

    if (searchString.startsWith(Directives.BeginTSDocComment.toLowerCase())) {
      return Directives.BeginTSDocComment;
    } else if (
      searchString.startsWith(Directives.EndTSDocComment.toLowerCase())
    ) {
      return Directives.EndTSDocComment;
    }

    throw new ParsingError('No directive at the provided index.');
  }

  private static isEmptyChunk(chunk: string) {
    return !chunk.trim();
  }

  private static discardPreviousChunk(pgComment: string) {
    const {
      index,
      [0]: { length },
    } = pgComment.match(this.chunkExtractionDirectivesPattern)!;
    return pgComment.slice(index! + length);
  }

  /**
   * Removes directives and leading/trailing new lines from each chunk. Filters
   * out lines/chunks whose only content was directives.
   */
  private static sanitizeChunks(chunks: string[]): string[] {
    let sanitizedChunks = this.removeLeadingAndTrailingNewLines(chunks);
    sanitizedChunks = this.removeDirectives(sanitizedChunks);
    return sanitizedChunks;
  }

  /**
   * All chunks are separated with empty lines by default, so leading and
   * trailing new lines are removed from each chunk.
   */
  private static removeLeadingAndTrailingNewLines(chunks: string[]): string[] {
    return chunks.map(chunk => {
      while (chunk.startsWith('\n')) {
        chunk = chunk.slice(1);
      }

      while (chunk.endsWith('\n')) {
        chunk = chunk.slice(0, chunk.length - 1);
      }

      return chunk;
    });
  }

  /**
   * Removes all IntrospeQL directives from the provided chunks and filters
   * out lines/chunks whose only contents were such directives.
   */
  private static removeDirectives(chunks: string[]): string[] {
    const result: string[] = [];

    chunks.forEach(chunk => {
      const lines = chunk.split('\n');
      const sanitizedLines: string[] = [];

      lines.forEach(line => {
        const sanitizedLine = line.replaceAll(
          this.chunkSanitizationDirectivesPattern,
          match => {
            if (/\s\S+\s/.test(match)) {
              return ' ';
            }

            return '';
          },
        );

        const directiveRemoved = sanitizedLine != line;

        if (!directiveRemoved || sanitizedLine.trim() != '') {
          sanitizedLines.push(sanitizedLine);
        }
      });

      if (sanitizedLines.length) {
        const sanitizedChunk = sanitizedLines.join('\n');
        result.push(sanitizedChunk);
      }
    });

    return result;
  }

  /**
   * Merges chunks and applies basic TSDoc formatting.
   */
  private static formatAndMergeChunks(chunks: string[]): string {
    const mergedChunks = chunks
      .map(chunk => {
        const lines = chunk.split('\n');
        return lines.map(line => ` * ${line}`).join('\n');
      })
      .join('\n *\n');

    return mergedChunks.length ? '/**\n' + mergedChunks + '\n */' : '';
  }

  /**
   * Prettifies a comment that has already received basic TSDoc formatting.
   */
  private static prettifyComment(comment: string): string {
    const prettified = prettifyComment(comment);
    return prettified;
  }

  /**
   * Verifies that *\/ occurs only at the very end of a TSDoc comment. This
   * validation must occur after the TSDoc comment is produced to guarantee that
   * the collapse of whitespace and/or removal of directives hasn't produced *\/.
   */
  private static validateComment(comment: string) {
    if (comment !== '' && comment.indexOf('*/') !== comment.length - 2) {
      throw new ParsingError('Comments cannot contain */');
    }
  }
}
