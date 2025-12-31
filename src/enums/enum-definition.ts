import { indent, convertPGIdentifierToTSIdentifier } from '../shared';

export class EnumDefinition {
  constructor(
    private pgEnumName: string,
    private values: string[],
    private comment?: string,
  ) {}

  toString() {
    const tsEnumName = convertPGIdentifierToTSIdentifier(this.pgEnumName);
    if (this.values.length === 0) return `export type ${tsEnumName} = never;`;

    const typeDefinition = this.values.map(v => `'${v}'`).join(' |\n');
    let stringified = `export type ${tsEnumName} = |\n${indent(typeDefinition, 2)};`;

    if (this.comment) {
      stringified = this.comment + '\n' + stringified;
    }

    return stringified;
  }
}
