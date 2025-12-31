export class ParameterTypeDefinition {
  constructor(
    protected tsType: string,
    protected isArray: boolean,
    protected isNullable: boolean,
    protected isVariadic: boolean,
    protected isOptional: boolean,
  ) {}

  public toString(): string {
    let type = this.tsType;

    if (this.isVariadic) {
      type = `...${type}[]`;
      return type;
    }

    if (this.isArray) type = `${type}[]`;
    if (this.isNullable) type = `${type} | null`;
    if (this.isOptional) type = `${type} | undefined`;

    return type;
  }
}
