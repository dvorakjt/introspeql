export abstract class AbstractCommentConverter {
  abstract convertComment(pgComment: string): string;
}
