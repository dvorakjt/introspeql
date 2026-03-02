import { FunctionOverloadDefinition } from './function-overload-definition';

export class FunctionDefinition {
  constructor(
    public pgName: string,
    public overloadDefinitions: FunctionOverloadDefinition[],
  ) {}
}
