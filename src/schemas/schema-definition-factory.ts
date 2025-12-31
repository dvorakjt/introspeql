import { SchemaDefinition } from './schema-definition';
import { EnumDefinition, type EnumData } from '../enums';
import {
  ColumnDefinition,
  ColumnTypeDefinition,
  TableDefinition,
} from '../tables';
import {
  FunctionData,
  FunctionDefinition,
  OverloadTypeDefinition,
  ParameterTypeDefinitionBuilder,
  ReturnTypeDefinition,
} from '../functions';
import { lookupType } from '../types';
import { CommentConverter } from '../comments';
import {
  convertPGIdentifierToTSIdentifier,
  Directives,
  getTokens,
  ParsingError,
} from '../shared';
import type { SchemaData, TableDataWithColumns } from './read-schema-data';
import type { ParsedConfig } from '../config';

export class SchemaDefinitionFactory {
  static createSchemaDefinition(data: SchemaData, config: ParsedConfig) {
    this.validateDBObjectNames(data.enums);
    this.validateDBObjectNames(data.tables);
    this.validateDBObjectNames(data.functions);

    const enumDefinitions = this.createSortedEnumDefinitions(data, config);
    const tableDefinitions = this.createSortedTableDefinitions(data, config);
    const functionDefinitions = this.createSortedFunctionDefinitions(
      data,
      config,
    );

    return new SchemaDefinition(
      data.name,
      enumDefinitions,
      tableDefinitions,
      functionDefinitions,
    );
  }

  private static validateDBObjectNames(dbObjects: { name: string }[]) {
    const seen = new Set<string>();
    for (const dbObject of dbObjects) {
      const formattedName = convertPGIdentifierToTSIdentifier(dbObject.name);
      if (seen.has(formattedName)) {
        throw new ParsingError('Duplicate identifier: ' + formattedName);
      }
      seen.add(formattedName);
    }
  }

  private static createSortedEnumDefinitions(
    data: SchemaData,
    config: ParsedConfig,
  ) {
    const sortedEnums = this.sortDBObjectData(data.enums);
    return this.createEnumDefinitions(sortedEnums, config);
  }

  private static sortDBObjectData<T extends { name: string }>(objectData: T[]) {
    return objectData.toSorted((a, b) => {
      return convertPGIdentifierToTSIdentifier(a.name).localeCompare(
        convertPGIdentifierToTSIdentifier(b.name),
      );
    });
  }

  private static createEnumDefinitions(
    enums: EnumData[],
    config: ParsedConfig,
  ) {
    const enumDefinitions = enums.map(enumData => {
      let comment = '';

      if (this.shouldCopyDBObjectComment(enumData, config)) {
        try {
          comment = CommentConverter.convertComment(enumData.comment!);
        } catch (e) {
          if (e instanceof ParsingError) {
            console.warn(e.message);
          } else {
            throw e;
          }
        }
      }

      return new EnumDefinition(enumData.name, enumData.values, comment);
    });

    return enumDefinitions;
  }

  private static shouldCopyDBObjectComment(
    objectData: { comment?: string | null },
    config: ParsedConfig,
  ) {
    if (!objectData.comment) return false;

    const commentTokens = getTokens(objectData.comment);

    return (
      (config.copyComments &&
        !commentTokens.includes(Directives.DisableTSDocComments)) ||
      (!config.copyComments &&
        commentTokens.includes(Directives.EnableTSDocComments))
    );
  }

  private static createSortedTableDefinitions(
    data: SchemaData,
    config: ParsedConfig,
  ) {
    const sortedTables = this.sortDBObjectData(data.tables);
    return this.createTableDefinitions(sortedTables, config);
  }

  private static createTableDefinitions(
    tables: TableDataWithColumns[],
    config: ParsedConfig,
  ) {
    const tableDefinitions = tables.map(tableData => {
      const shouldCopyTableComment = this.shouldCopyDBObjectComment(
        tableData,
        config,
      );

      let comment = '';
      if (shouldCopyTableComment) {
        try {
          comment = CommentConverter.convertComment(tableData.comment!);
        } catch (e) {
          if (e instanceof ParsingError) {
            console.warn(e.message);
          } else {
            throw e;
          }
        }
      }

      /*
        By default, comments on a column are copied if the parent table's
        comments should be copied. This can be overridden with directives
        applied to the column-level comment directly.
      */
      const shouldCopyColumnComment = (comment: string | null) => {
        if (!comment) return false;

        const tokens = getTokens(comment);
        return (
          (shouldCopyTableComment &&
            !tokens.includes(Directives.DisableTSDocComments)) ||
          (!shouldCopyTableComment &&
            tokens.includes(Directives.EnableTSDocComments))
        );
      };

      const columnDefinitions = tableData.columns.map(columnData => {
        const tsType = lookupType(columnData.type, tableData.schema, config);

        const typeDefinition = new ColumnTypeDefinition(
          tsType,
          columnData.type.numDimensions,
          columnData.type.isNullable,
        );

        let comment = '';
        if (shouldCopyColumnComment(columnData.comment)) {
          try {
            comment = CommentConverter.convertComment(columnData.comment!);
          } catch (e) {
            if (e instanceof ParsingError) {
              console.warn(e.message);
            } else {
              throw e;
            }
          }
        }

        return new ColumnDefinition(columnData.name, typeDefinition, comment);
      });

      return new TableDefinition(tableData.name, columnDefinitions, comment);
    });

    return tableDefinitions;
  }

  private static createSortedFunctionDefinitions(
    data: SchemaData,
    config: ParsedConfig,
  ) {
    const sortedFunctionData = this.sortDBObjectData(data.functions);
    return this.createFunctionDefinitions(sortedFunctionData, config);
  }

  private static createFunctionDefinitions(
    functions: FunctionData[],
    config: ParsedConfig,
  ) {
    return functions.map(functionData => {
      const overloadDefinitions = functionData.overloads.map(overloadData => {
        const overloadCommentTokens = getTokens(overloadData.comment);

        const nullableArgs =
          (config.functions.nullableArgs &&
            !overloadCommentTokens.includes(Directives.DisableNullableArgs)) ||
          (!config.functions.nullableArgs &&
            overloadCommentTokens.includes(Directives.EnableNullableArgs));

        const parameterTypeDefs = overloadData.paramTypes.map(paramType => {
          const tsType = lookupType(paramType, functionData.schema, config);

          return ParameterTypeDefinitionBuilder.getBuilder()
            .withTSType(tsType)
            .withIsArray(paramType.isArray)
            .withIsNullable(nullableArgs)
            .withIsVariadic(paramType.isVariadic)
            .withIsOptional(paramType.isOptional)
            .build();
        });

        const returnType = lookupType(
          overloadData.returnType,
          functionData.schema,
          config,
        );

        const nullableReturnType =
          (config.functions.nullableReturnTypes &&
            !overloadCommentTokens.includes(
              Directives.DisableNullableReturnTypes,
            )) ||
          (!config.functions.nullableReturnTypes &&
            overloadCommentTokens.includes(
              Directives.EnableNullableReturnTypes,
            ));

        const returnTypeDefinition = new ReturnTypeDefinition(
          returnType,
          overloadData.returnType.isArray,
          nullableReturnType,
        );

        return new OverloadTypeDefinition(
          parameterTypeDefs,
          returnTypeDefinition,
        );
      });

      return new FunctionDefinition(functionData.name, overloadDefinitions);
    });
  }
}
