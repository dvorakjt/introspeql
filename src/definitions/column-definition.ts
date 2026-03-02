import type { ColumnTypeDefinition } from './column-type-definition';

export class ColumnDefinition {
  constructor(
    public pgName: string,
    public tsDocComment: string | undefined,
    public typeDefinition: ColumnTypeDefinition,
  ) {}
}
