import { EnumDefinition } from '../enums';
import { FunctionDefinition } from '../functions';
import { TableDefinition } from '../tables';
import { convertPGIdentifierToTSIdentifier, indent } from '../shared';

export class SchemaDefinition {
  constructor(
    protected pgSchemaName: string,
    protected enumDefinitions: EnumDefinition[],
    protected tableDefinitions: TableDefinition[],
    protected functionDefinitions: FunctionDefinition[],
  ) {}

  toString() {
    const tsSchemaName = convertPGIdentifierToTSIdentifier(this.pgSchemaName);

    const enums = this.enumDefinitions
      .map(enumDef => enumDef.toString())
      .join('\n\n');

    const tables = this.tableDefinitions
      .map(tableDef => tableDef.toString())
      .join('\n\n');

    const functions = this.functionDefinitions
      .map(funcDef => funcDef.toString())
      .join('\n\n');

    let result = `export namespace ${tsSchemaName} {
  export const PGSchemaName = '${this.pgSchemaName}';`;

    if (enums.length) {
      result += `\n\n  export namespace Enums {
${indent(enums, 4)}
  }`;
    }

    if (tables.length) {
      result += `\n\n  export namespace Tables {
${indent(tables, 4)}
  }`;
    }

    if (functions.length) {
      result += `\n\n  export namespace Functions {
${indent(functions, 4)}
  }`;
    }

    result += '\n}';
    return result;
  }
}
