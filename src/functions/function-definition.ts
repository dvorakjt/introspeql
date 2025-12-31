import { indent, convertPGIdentifierToTSIdentifier } from '../shared';
import { OverloadTypeDefinition } from './overload-type-definition';

export class FunctionDefinition {
  constructor(
    protected pgFunctionName: string,
    protected overloadTypeDefinitions: OverloadTypeDefinition[],
  ) {}

  toString() {
    const tsNamespaceName = convertPGIdentifierToTSIdentifier(
      this.pgFunctionName,
    );

    const overloads = this.overloadTypeDefinitions
      .map(overloadTypeDef => {
        return overloadTypeDef.toString();
      })
      .join(',\n');

    return `export namespace ${tsNamespaceName} {
  export const PGFunctionName = '${this.pgFunctionName}';

  export type Overloads = [
${indent(overloads, 4)}
  ];
}`;
  }
}
