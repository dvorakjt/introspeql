import { SchemaDefinition } from './schema-definition';
import { EnumDefinition } from './enum-definition';
import { RelationDefinition } from './relation-definition';
import { ColumnDefinition } from './column-definition';
import { ColumnTypeDefinition } from './column-type-definition';
import { FunctionDefinition } from './function-definition';
import { FunctionParameterDefinitionBuilder } from './function-parameter-definition-builder';
import { FunctionReturnTypeDefinition } from './function-return-type-definition';
import { FunctionOverloadDefinition } from './function-overload-definition';
import { CommentConverter, Directives, getTokens } from '../comments';
import type { ParsedConfig } from '../config';
import type { EnumStub } from './enum-stub';
import type {
  EnumData,
  RelationDataWithColumns,
  FunctionData,
  SchemaData,
} from '../introspection';
import { sortByPGName } from '../shared';

export class SchemaDefinitionFactory {
  static createSchemaDefinition(data: SchemaData, config: ParsedConfig) {
    const tableDefinitions = sortByPGName(
      this.createRelationDefinitions(data.tables, config),
    );

    const viewDefinitions = sortByPGName(
      this.createRelationDefinitions(data.views, config),
    );

    const materializedViewDefinitions = sortByPGName(
      this.createRelationDefinitions(data.materializedViews, config),
    );

    const functionDefinitions = sortByPGName(
      this.createFunctionDefinitions(data.functions, config),
    );

    const enumDefinitions = sortByPGName(
      this.createEnumDefinitions(data.enums, config),
    );

    return new SchemaDefinition(
      data.name,
      tableDefinitions,
      viewDefinitions,
      materializedViewDefinitions,
      functionDefinitions,
      enumDefinitions,
    );
  }

  private static createRelationDefinitions(
    relations: RelationDataWithColumns[],
    config: ParsedConfig,
  ): RelationDefinition[] {
    return relations.map(relationData => {
      const isCopyingRelationCommentPermitted =
        this.isCopyingDBObjectCommentPermitted(relationData.comment, config);

      let tsDocComment = '';

      if (relationData.comment && isCopyingRelationCommentPermitted) {
        const { success, result, message } = CommentConverter.convertComment(
          relationData.comment,
        );

        if (!success) {
          if (message) {
            console.warn(message);
          }
        } else if (result) {
          tsDocComment = result;
        }
      }

      /*
        By default, comments on a column are copied if the parent relation's
        comments should be copied. This can be overridden with directives
        applied to the column-level comment directly.
      */
      const isCopyingColumnCommentPermitted = (comment: string | null) => {
        const tokens = getTokens(comment);

        return (
          (isCopyingRelationCommentPermitted &&
            !tokens.includes(Directives.DisableTSDocComments)) ||
          (!isCopyingRelationCommentPermitted &&
            tokens.includes(Directives.EnableTSDocComments))
        );
      };

      const columnDefinitions = relationData.columns.map(columnData => {
        const tsType = this.lookupType(columnData.type, config);

        const typeDefinition = new ColumnTypeDefinition(
          tsType,
          columnData.type.numDimensions,
          columnData.type.isNullable,
          columnData.type.generated,
        );

        let tsDocComment: string | undefined = undefined;

        if (
          columnData.comment &&
          isCopyingColumnCommentPermitted(columnData.comment)
        ) {
          const { success, result, message } = CommentConverter.convertComment(
            columnData.comment,
          );

          if (!success) {
            if (message) {
              console.warn(message);
            }
          } else if (result) {
            tsDocComment = result;
          }
        }

        return new ColumnDefinition(
          columnData.name,
          tsDocComment,
          typeDefinition,
        );
      });

      return new RelationDefinition(
        relationData.name,
        tsDocComment,
        columnDefinitions,
      );
    });
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
          const tsType = this.lookupType(paramType, config);

          return FunctionParameterDefinitionBuilder.getBuilder()
            .withTSType(tsType)
            .withIsArray(paramType.isArray)
            .withIsNullable(nullableArgs)
            .withIsVariadic(paramType.isVariadic)
            .withIsOptional(paramType.isOptional)
            .build();
        });

        const returnType = this.lookupType(overloadData.returnType, config);

        const nullableReturnType =
          (config.functions.nullableReturnTypes &&
            !overloadCommentTokens.includes(
              Directives.DisableNullableReturnTypes,
            )) ||
          (!config.functions.nullableReturnTypes &&
            overloadCommentTokens.includes(
              Directives.EnableNullableReturnTypes,
            ));

        const returnTypeDefinition = new FunctionReturnTypeDefinition(
          returnType,
          overloadData.returnType.isArray,
          nullableReturnType,
        );

        return new FunctionOverloadDefinition(
          parameterTypeDefs,
          returnTypeDefinition,
        );
      });

      return new FunctionDefinition(functionData.name, overloadDefinitions);
    });
  }

  private static createEnumDefinitions(
    enums: EnumData[],
    config: ParsedConfig,
  ) {
    const enumDefinitions = enums.map(enumData => {
      let tsDocComment: string | undefined = undefined;

      if (
        enumData.comment &&
        this.isCopyingDBObjectCommentPermitted(enumData.comment, config)
      ) {
        const { success, result, message } = CommentConverter.convertComment(
          enumData.comment,
        );

        if (!success) {
          if (message) {
            console.warn(message);
          }
        } else if (result) {
          tsDocComment = result;
        }
      }

      return new EnumDefinition(enumData.name, tsDocComment, enumData.values);
    });

    return enumDefinitions;
  }

  private static isCopyingDBObjectCommentPermitted(
    comment: string | null,
    config: ParsedConfig,
  ) {
    const commentTokens = getTokens(comment);

    return (
      (config.copyComments &&
        !commentTokens.includes(Directives.DisableTSDocComments)) ||
      (!config.copyComments &&
        commentTokens.includes(Directives.EnableTSDocComments))
    );
  }

  private static lookupType(
    {
      schema,
      name,
      isEnum,
    }: {
      schema: string;
      name: string;
      isEnum: boolean;
    },
    config: ParsedConfig,
  ): string | EnumStub {
    const key = `${schema}.${name}`;

    if (key in config.types) {
      return config.types[key];
    }

    if (isEnum) {
      return {
        enumName: name,
        enumSchema: schema,
      };
    }

    return 'string';
  }
}
