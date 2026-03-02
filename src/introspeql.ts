import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { introspeqlConfigSchema, type IntrospeQLConfig } from './config';
import { readSchemaData } from './introspection';
import { SchemaDefinitionFactory } from './definitions';
import { sortByPGName } from './shared';

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

    const schemaData = await readSchemaData(client, parsedConfig);
    const schemaDefinitions = sortByPGName(
      Object.values(schemaData).map(schemaData => {
        return SchemaDefinitionFactory.createSchemaDefinition(
          schemaData,
          parsedConfig,
        );
      }),
    );

    const typeDefinitions =
      parsedConfig.createTypeDefinitions(schemaDefinitions);
    const typeDefFileContents =
      parsedConfig.header ?
        prependHeader(typeDefinitions, parsedConfig.header)
      : typeDefinitions;

    if (parsedConfig.writeToDisk) {
      await writeTypeDefinitionsFile(typeDefFileContents, parsedConfig.outFile);
    }

    return typeDefFileContents;
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

function prependHeader(typeDefinitions: string, header: string) {
  while (!header.endsWith('\n\n')) {
    header += '\n';
  }

  return header + typeDefinitions;
}

async function writeTypeDefinitionsFile(fileContents: string, outFile: string) {
  const directoryPath = path.dirname(outFile);
  if (!existsSync(directoryPath)) {
    await mkdir(directoryPath, { recursive: true });
  }

  await writeFile(outFile, fileContents, 'utf-8');
}
