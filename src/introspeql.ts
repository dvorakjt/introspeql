import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import {
  introspeqlConfigSchema,
  type IntrospeQLConfig,
  type ParsedConfig,
} from './config';
import {
  readSchemaData,
  SchemaDefinitionFactory,
  type SchemaDefinition,
} from './schemas';
import { Client } from 'pg';
import { convertPGIdentifierToTSIdentifier } from './shared';

/**
 * Reads information about schemas, tables, columns, functions, and enums from
 * a PostgreSQL database and generates a TypeScript file containing type
 * definitions for those objects.
 */
export async function introspeql(config: IntrospeQLConfig) {
  const parsedConfig = introspeqlConfigSchema.parse(config);
  const client = new Client(
    parsedConfig.dbConnectionParams || parsedConfig.dbConnectionString,
  );

  try {
    await client.connect();

    const schemas = await readSchemaData(client, parsedConfig);
    const schemaDefinitions = Object.values(schemas)
      .sort((a, b) => {
        return convertPGIdentifierToTSIdentifier(a.name).localeCompare(
          convertPGIdentifierToTSIdentifier(b.name),
        );
      })
      .map(schemaData => {
        return SchemaDefinitionFactory.createSchemaDefinition(
          schemaData,
          parsedConfig,
        );
      });

    const typeDefinitionFileContents = createTypeDefinitionFileContents(
      schemaDefinitions,
      parsedConfig,
    );

    if (parsedConfig.writeToDisk) {
      await writeTypeDefinitionsFile(
        typeDefinitionFileContents,
        parsedConfig.outFile,
      );
    }

    return typeDefinitionFileContents;
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

function createTypeDefinitionFileContents(
  schemaDefinitions: SchemaDefinition[],
  parsedConfig: ParsedConfig,
) {
  let fileContents = (
    typeof parsedConfig.typeDefinitionGenerator === 'function' ?
      new parsedConfig.typeDefinitionGenerator()
    : parsedConfig.typeDefinitionGenerator).generateTypeDefinitions(
    schemaDefinitions,
  );

  if (parsedConfig.header) {
    let header = parsedConfig.header;
    while (!header.endsWith('\n\n')) {
      header += '\n';
    }
    fileContents = header + fileContents;
  }

  return fileContents;
}

async function writeTypeDefinitionsFile(fileContents: string, outFile: string) {
  const directoryPath = path.dirname(outFile);
  if (!existsSync(directoryPath)) {
    await mkdir(directoryPath, { recursive: true });
  }

  await writeFile(outFile, fileContents, 'utf-8');
}
