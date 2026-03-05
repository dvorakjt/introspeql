import { capitalize } from '../shared';
import type {
  ColumnDefinition,
  ColumnTypeDefinition,
  EnumDefinition,
  EnumStub,
  FunctionDefinition,
  FunctionOverloadDefinition,
  FunctionParameterDefinition,
  FunctionReturnTypeDefinition,
  RelationDefinition,
  SchemaDefinition,
} from '../definitions';

export class LegacyTypeGenerator {
  static createTypeDefinitions(schemaDefinitions: SchemaDefinition[]) {
    return schemaDefinitions
      .map(schemaDefinition => this.schemaToString(schemaDefinition))
      .join('\n\n');
  }

  private static schemaToString(schemaDefinition: SchemaDefinition) {
    const tsSchemaName = this.convertPGIdentifierToTSIdentifier(
      schemaDefinition.pgName,
    );

    const enums = schemaDefinition.enumDefinitions
      .map(enumDef => this.enumToString(enumDef))
      .join('\n\n');

    const tables = schemaDefinition.tableDefinitions
      .map(tableDef =>
        this.relationToString(tableDef, 'table', schemaDefinition.pgName),
      )
      .join('\n\n');

    const views = schemaDefinition.viewDefinitions
      .map(viewDef =>
        this.relationToString(viewDef, 'view', schemaDefinition.pgName),
      )
      .join('\n\n');

    const materializedViews = schemaDefinition.materializedViewDefinitions
      .map(matViewDef =>
        this.relationToString(
          matViewDef,
          'materializedView',
          schemaDefinition.pgName,
        ),
      )
      .join('\n\n');

    const functions = schemaDefinition.functionDefinitions
      .map(funcDef => this.functionToString(funcDef, schemaDefinition.pgName))
      .join('\n\n');

    let result = `export namespace ${tsSchemaName} {
  export const PGSchemaName = '${schemaDefinition.pgName}';`;

    if (enums.length) {
      result += `\n\n  export namespace Enums {
${this.indent(enums, 4)}
  }`;
    }

    if (tables.length) {
      result += `\n\n  export namespace Tables {
${this.indent(tables, 4)}
  }`;
    }

    if (views.length) {
      result += `\n\n  export namespace Views {
${this.indent(views, 4)}
  }`;
    }

    if (materializedViews.length) {
      result += `\n\n  export namespace MaterializedViews {
${this.indent(materializedViews, 4)}
  }`;
    }

    if (functions.length) {
      result += `\n\n  export namespace Functions {
${this.indent(functions, 4)}
  }`;
    }

    result += '\n}';
    return result;
  }

  private static relationToString(
    relationDefinition: RelationDefinition,
    relationType: 'table' | 'view' | 'materializedView',
    parentSchemaName: string,
  ) {
    const tsNamespaceName = this.convertPGIdentifierToTSIdentifier(
      relationDefinition.pgName,
    );

    const columnNames = this.createColumnNamesUnion(relationDefinition);
    const rowType = this.createRowTypeDefinition(
      relationDefinition,
      parentSchemaName,
    );

    let stringified = `export namespace ${tsNamespaceName} {
  export const PG${capitalize(relationType)}Name = '${relationDefinition.pgName}';

${this.indent(columnNames, 2)}

${this.indent(rowType, 2)}
}`;

    if (relationDefinition.tsDocComment) {
      stringified = relationDefinition.tsDocComment + '\n' + stringified;
    }

    return stringified;
  }

  private static createColumnNamesUnion(
    relationDefinition: RelationDefinition,
  ) {
    if (relationDefinition.columns.length === 0) {
      return 'export type ColumnNames = never;';
    }

    const columnNames = relationDefinition.columns
      .map(columnDefinition => {
        return `'${columnDefinition.pgName}'`;
      })
      .join(' |\n');

    return `export type ColumnNames = |
${this.indent(columnNames, 2)};`;
  }

  private static createRowTypeDefinition(
    relationDefinition: RelationDefinition,
    parentSchemaName: string,
  ) {
    if (relationDefinition.columns.length === 0) {
      return 'export interface RowType {}';
    }

    const columnDefinitions = relationDefinition.columns
      .map(columnDefinition =>
        this.columnToString(columnDefinition, parentSchemaName),
      )
      .join('\n');

    return `export interface RowType {
${this.indent(columnDefinitions, 2)}
}`;
  }

  private static columnToString(
    columnDefinition: ColumnDefinition,
    parentSchemaName: string,
  ) {
    let stringified = `['${columnDefinition.pgName}']: ${this.columnTypeToString(columnDefinition.typeDefinition, parentSchemaName)};`;

    if (columnDefinition.tsDocComment) {
      stringified = columnDefinition.tsDocComment + '\n' + stringified;
    }

    return stringified;
  }

  private static columnTypeToString(
    columnTypeDefinition: ColumnTypeDefinition,
    parentSchemaName: string,
  ) {
    let type: string;
    if (typeof columnTypeDefinition.tsType === 'object') {
      type = this.enumStubToString(
        columnTypeDefinition.tsType,
        parentSchemaName,
      );
    } else type = columnTypeDefinition.tsType;

    type += '[]'.repeat(columnTypeDefinition.numDimensions);
    if (columnTypeDefinition.isNullable) type = `${type} | null`;
    return type;
  }

  private static enumStubToString(
    stub: EnumStub,
    parentSchemaName: string,
  ): string {
    let type = `Enums.${this.convertPGIdentifierToTSIdentifier(stub.enumName)}`;
    if (stub.enumSchema !== parentSchemaName)
      type = `${this.convertPGIdentifierToTSIdentifier(stub.enumSchema)}.${type}`;
    return type;
  }

  private static functionToString(
    functionDefinition: FunctionDefinition,
    parentSchemaName: string,
  ) {
    const tsNamespaceName = this.convertPGIdentifierToTSIdentifier(
      functionDefinition.pgName,
    );

    const overloads = functionDefinition.overloadDefinitions
      .map(overloadDefinition => {
        return this.functionOverloadToString(
          overloadDefinition,
          parentSchemaName,
        );
      })
      .join(',\n');

    return `export namespace ${tsNamespaceName} {
  export const PGFunctionName = '${functionDefinition.pgName}';

  export type Overloads = [
${this.indent(overloads, 4)}
  ];
}`;
  }

  private static functionOverloadToString(
    overloadDefinition: FunctionOverloadDefinition,
    parentSchemaName: string,
  ) {
    const parameterTypes =
      'ParameterTypes: [\n' +
      overloadDefinition.parameterDefinitions
        .map(
          parameterDefinition =>
            '  ' +
            this.parameterDefinitionToString(
              parameterDefinition,
              parentSchemaName,
            ),
        )
        .join(',\n') +
      '\n]';

    const returnType =
      'ReturnType: ' +
      this.returnTypeDefinitionToString(
        overloadDefinition.returnTypeDefinition,
        parentSchemaName,
      );

    return (
      '{\n' +
      this.indent(parameterTypes, 2) +
      ',\n' +
      this.indent(returnType, 2) +
      '\n}'
    );
  }

  private static parameterDefinitionToString(
    parameterDefinition: FunctionParameterDefinition,
    parentSchemaName: string,
  ) {
    let type: string;

    if (typeof parameterDefinition.tsType === 'object') {
      type = this.enumStubToString(
        parameterDefinition.tsType,
        parentSchemaName,
      );
    } else type = parameterDefinition.tsType;

    if (parameterDefinition.isVariadic) {
      type = `...${type}[]`;
      return type;
    }

    if (parameterDefinition.isArray) type = `${type}[]`;
    if (parameterDefinition.isNullable) type = `${type} | null`;
    if (parameterDefinition.isOptional) type = `${type} | undefined`;

    return type;
  }

  private static returnTypeDefinitionToString(
    returnTypeDefinition: FunctionReturnTypeDefinition,
    parentSchemaName: string,
  ) {
    let type: string;

    if (typeof returnTypeDefinition.tsType === 'object') {
      type = this.enumStubToString(
        returnTypeDefinition.tsType,
        parentSchemaName,
      );
    } else type = returnTypeDefinition.tsType;

    if (returnTypeDefinition.isArray) type = `${type}[]`;
    if (returnTypeDefinition.isNullable) type = `${type} | null`;

    return type;
  }

  private static enumToString(enumDefinition: EnumDefinition) {
    const tsEnumName = this.convertPGIdentifierToTSIdentifier(
      enumDefinition.pgName,
    );

    if (enumDefinition.values.length === 0)
      return `export type ${tsEnumName} = never;`;

    const typeDefinition = enumDefinition.values
      .map(v => `'${v}'`)
      .join(' |\n');
    let stringified = `export type ${tsEnumName} = |\n${this.indent(typeDefinition, 2)};`;

    if (enumDefinition.tsDocComment) {
      stringified = enumDefinition.tsDocComment + '\n' + stringified;
    }

    return stringified;
  }

  private static convertPGIdentifierToTSIdentifier(identifier: string) {
    // preserve leading underscores
    let prefix = '';

    while (identifier.startsWith('_')) {
      prefix += '_';
      identifier = identifier.slice(1);
    }

    const words = [];
    let word = '';

    for (const char of identifier) {
      if (char === "'") continue;

      if (/[^A-Za-z]/.test(char)) {
        if (word.length) words.push(word);
        if (/[0-9$]/.test(char)) {
          words.push(char);
        }
        word = '';
      } else {
        word += char;
      }
    }

    if (word.length) {
      words.push(word);
    }

    let result = prefix + words.map(word => capitalize(word)).join('');
    if (/^\d/.test(result)) result = '_' + result;
    return result;
  }

  private static indent(str: string, spaces: number) {
    return str
      .split('\n')
      .map(line => ' '.repeat(spaces) + line)
      .join('\n');
  }
}
