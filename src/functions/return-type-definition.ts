export class ReturnTypeDefinition {
  constructor(
    protected tsType: string,
    protected isArray: boolean,
    protected isNullable: boolean,
  ) {}

  public toString(): string {
    let type = this.tsType;
    if (this.isArray) type = `${type}[]`;
    if (this.isNullable) type = `${type} | null`;
    return type;
  }
}
