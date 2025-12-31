import { indent } from '../shared';
import { ParameterTypeDefinition } from './parameter-type-definition';
import { ReturnTypeDefinition } from './return-type-definition';

export class OverloadTypeDefinition {
  constructor(
    protected parameterTypeDefinitions: ParameterTypeDefinition[],
    protected returnTypeTypeDefinition: ReturnTypeDefinition,
  ) {}

  toString() {
    const parameterTypes =
      'ParameterTypes: [\n' +
      this.parameterTypeDefinitions
        .map(paramTypeDef => '  ' + paramTypeDef.toString())
        .join(',\n') +
      '\n]';

    const returnType =
      'ReturnType: ' + this.returnTypeTypeDefinition.toString();

    return (
      '{\n' + indent(parameterTypes, 2) + ',\n' + indent(returnType, 2) + '\n}'
    );
  }
}
