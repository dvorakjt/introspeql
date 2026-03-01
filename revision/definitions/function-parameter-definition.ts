import { EnumStub } from './enum-stub';

export class FunctionParameterDefinition {
  constructor(
    public tsType: string | EnumStub,
    public isArray: boolean,
    public isNullable: boolean,
    public isVariadic: boolean,
    public isOptional: boolean,
  ) {}
}
