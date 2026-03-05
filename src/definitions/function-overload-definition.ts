import { FunctionParameterDefinition } from './function-parameter-definition';
import { FunctionReturnTypeDefinition } from './function-return-type-definition';

export class FunctionOverloadDefinition {
  constructor(
    public parameterDefinitions: FunctionParameterDefinition[],
    public returnTypeDefinition: FunctionReturnTypeDefinition,
  ) {}
}
