export class FunctionParameterDefinition {
  constructor(
    public tsType: string,
    public isArray: boolean,
    public isNullable: boolean,
    public isVariadic: boolean,
    public isOptional: boolean,
  ) {}
}
