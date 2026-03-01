export class FunctionReturnTypeDefinition {
  constructor(
    public tsType: string,
    public isArray: boolean,
    public isNullable: boolean,
  ) {}
}
