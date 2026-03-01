export class ColumnTypeDefinition {
  constructor(
    public tsType: string,
    public numDimensions: number,
    public isNullable: boolean,
    public generated: 'never' | 'optionally' | 'always',
  ) {}
}
