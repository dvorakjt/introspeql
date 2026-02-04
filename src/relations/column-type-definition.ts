export class ColumnTypeDefinition {
  constructor(
    protected tsType: string,
    protected numDimensions: number,
    protected isNullable: boolean,
  ) {}

  public toString(): string {
    let type = this.tsType;
    type += '[]'.repeat(this.numDimensions);
    if (this.isNullable) type = `${type} | null`;
    return type;
  }
}
