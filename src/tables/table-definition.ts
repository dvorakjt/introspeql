import { indent, convertPGIdentifierToTSIdentifier } from '../shared';
import { ColumnDefinition } from './column-definition';

export class TableDefinition {
  constructor(
    protected pgTableName: string,
    protected columns: ColumnDefinition[],
    private comment?: string,
  ) {}

  toString() {
    const tsNamespaceName = convertPGIdentifierToTSIdentifier(this.pgTableName);
    const columnNames = this.createColumnNamesUnion();
    const rowType = this.createRowTypeDefinition();

    let stringified = `export namespace ${tsNamespaceName} {
  export const PGTableName = '${this.pgTableName}';

${indent(columnNames, 2)}

${indent(rowType, 2)}
}`;

    if (this.comment) {
      stringified = this.comment + '\n' + stringified;
    }

    return stringified;
  }

  protected createColumnNamesUnion() {
    if (this.columns.length === 0) {
      return 'export type ColumnNames = never;';
    }

    const columnNames = this.columns
      .map(columnDefinition => {
        return `'${columnDefinition.pgColumnName}'`;
      })
      .join(' |\n');

    return `export type ColumnNames = |
${indent(columnNames, 2)};`;
  }

  protected createRowTypeDefinition() {
    if (this.columns.length === 0) {
      return 'export interface RowType {}';
    }

    const columnDefinitions = this.columns
      .map(columnDefinition => columnDefinition.toString())
      .join('\n');

    return `export interface RowType {
${indent(columnDefinitions, 2)}
}`;
  }
}
