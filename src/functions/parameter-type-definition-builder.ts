import { ParameterTypeDefinition } from './parameter-type-definition';

export class ParameterTypeDefinitionBuilder {
  static getBuilder() {
    return new ParameterTypeDefinitionBuilder();
  }

  withTSType(tsType: string) {
    return new ParameterTypeDefinitionBuilder(
      tsType,
      this.isArray,
      this.isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  withIsArray(isArray: boolean) {
    return new ParameterTypeDefinitionBuilder(
      this.tsType,
      isArray,
      this.isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  withIsNullable(isNullable: boolean) {
    return new ParameterTypeDefinitionBuilder(
      this.tsType,
      this.isArray,
      isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  withIsVariadic(isVariadic: boolean) {
    return new ParameterTypeDefinitionBuilder(
      this.tsType,
      this.isArray,
      this.isNullable,
      isVariadic,
      this.isOptional,
    );
  }

  withIsOptional(isOptional: boolean) {
    return new ParameterTypeDefinitionBuilder(
      this.tsType,
      this.isArray,
      this.isNullable,
      this.isVariadic,
      isOptional,
    );
  }

  build() {
    return new ParameterTypeDefinition(
      this.tsType,
      this.isArray,
      this.isNullable,
      this.isVariadic,
      this.isOptional,
    );
  }

  private constructor(
    protected tsType: string = 'unknown',
    protected isArray: boolean = false,
    protected isNullable: boolean = false,
    protected isVariadic: boolean = false,
    protected isOptional = false,
  ) {}
}
