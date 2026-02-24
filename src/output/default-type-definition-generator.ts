import { SchemaDefinition } from '../schemas';
import { AbstractTypeDefinitionGenerator } from './abstract-type-definition-generator';

export class DefaultTypeDefinitionGenerator extends AbstractTypeDefinitionGenerator {
  generateTypeDefinitions(schemaDefinitions: SchemaDefinition[]): string {
    return schemaDefinitions
      .map(schemaDef => schemaDef.toString())
      .join('\n\n');
  }
}
