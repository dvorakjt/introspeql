import { FunctionParameterDefinition } from './function-parameter-definition';
import type { EnumStub } from './enum-stub';

export class FunctionParameterDefinitionBuilder {
  static getBuilder() {
    return new FunctionParameterDefinitionBuilder();
  }

  withTSType(tsType: string | EnumStub) {
    return new FunctionParameterDefinitionBuilder(
      tsType,
      this.isArray,
      this.isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  withIsArray(isArray: boolean) {
    return new FunctionParameterDefinitionBuilder(
      this.tsType,
      isArray,
      this.isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  withIsNullable(isNullable: boolean) {
    return new FunctionParameterDefinitionBuilder(
      this.tsType,
      this.isArray,
      isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  withIsVariadic(isVariadic: boolean) {
    return new FunctionParameterDefinitionBuilder(
      this.tsType,
      this.isArray,
      this.isNullable,
      isVariadic,
      this.isOptional,
    );
  }

  withIsOptional(isOptional: boolean) {
    return new FunctionParameterDefinitionBuilder(
      this.tsType,
      this.isArray,
      this.isNullable,
      this.isVariadic,
      isOptional,
    );
  }

  build() {
    return new FunctionParameterDefinition(
      this.tsType,
      this.isArray,
      this.isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  private constructor(
    protected tsType: string | EnumStub = 'unknown',
    protected isArray: boolean = false,
    protected isNullable: boolean = false,
    protected isVariadic: boolean = false,
    protected isOptional = false,
  ) {}
}
