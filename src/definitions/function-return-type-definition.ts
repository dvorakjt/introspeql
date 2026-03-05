import { EnumStub } from './enum-stub';

export class FunctionReturnTypeDefinition {
  constructor(
    public tsType: string | EnumStub,
    public isArray: boolean,
    public isNullable: boolean,
  ) {}
}
