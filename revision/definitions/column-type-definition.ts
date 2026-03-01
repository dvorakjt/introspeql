export class ColumnTypeDefinition {
  constructor(
    public tsType: string,
    public numDimensions: number,
    public isNullable: boolean,
    public generated: 'never' | 'by_default' | 'always',
  ) {}
}
