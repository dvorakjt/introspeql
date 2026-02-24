import type { SchemaDefinition } from '../schemas';

export abstract class AbstractTypeDefinitionGenerator {
  abstract generateTypeDefinitions(
    schemaDefinitions: SchemaDefinition[],
  ): string;
}
