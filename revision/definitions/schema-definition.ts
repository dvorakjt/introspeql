import type { EnumDefinition } from './enum-definition';
import type { FunctionDefinition } from './function-definition';
import type { RelationDefinition } from './relation-definition';

export class SchemaDefinition {
  constructor(
    public pgName: string,
    public tsDocComment: string | undefined,
    public enumDefinitions: EnumDefinition[],
    public functionDefinitions: FunctionDefinition[],
    public tableDefinitions: RelationDefinition[],
    public viewDefinitions: RelationDefinition[],
    public materializedViewDefinitions: RelationDefinition[],
  ) {}
}
