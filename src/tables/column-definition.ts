import type { ColumnTypeDefinition } from './column-type-definition';

export class ColumnDefinition {
  constructor(
    public readonly pgColumnName: string,
    private typeDefinition: ColumnTypeDefinition,
    private comment?: string,
  ) {}

  toString() {
    let stringified = `['${this.pgColumnName}']: ${this.typeDefinition.toString()};`;

    if (this.comment) {
      stringified = this.comment + '\n' + stringified;
    }

    return stringified;
  }
}
