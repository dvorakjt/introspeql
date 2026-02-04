import {
  indent,
  convertPGIdentifierToTSIdentifier,
  capitalize,
} from '../shared';
import { ColumnDefinition } from './column-definition';

export class RelationDefinition {
  constructor(
    protected pgRelationName: string,
    protected relationType: 'table' | 'view' | 'materializedView',
    protected columns: ColumnDefinition[],
    protected comment?: string,
  ) {}

  toString() {
    const tsNamespaceName = convertPGIdentifierToTSIdentifier(
      this.pgRelationName,
    );
    const columnNames = this.createColumnNamesUnion();
    const rowType = this.createRowTypeDefinition();

    let stringified = `export namespace ${tsNamespaceName} {
  export const PG${capitalize(this.relationType)}Name = '${this.pgRelationName}';

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
