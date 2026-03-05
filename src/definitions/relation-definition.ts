import { ColumnDefinition } from './column-definition';

export class RelationDefinition {
  constructor(
    public pgName: string,
    public tsDocComment: string | undefined,
    public columns: ColumnDefinition[],
  ) {}
}
