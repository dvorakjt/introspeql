import { AbstractRelationDefinition } from './abstract-relation-definition';

export class MaterializedViewDefinition extends AbstractRelationDefinition {
  protected relationType = 'materializedView';
}
