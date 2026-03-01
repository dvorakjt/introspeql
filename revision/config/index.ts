import { z } from 'zod';
import { connectionOptions } from './connection-options';
import { functionOptions } from './function-options';
import { generalOptions } from './general-options';
import { materializedViewOptions } from './materialized-view-options';
import { outputOptions } from './output-options';
import { tableOptions } from './table-options';
import { viewOptions } from './view-options';

const introspeqlConfigSchema = generalOptions
  .and(connectionOptions)
  .and(outputOptions)
  .and(
    z.object({
      tables: tableOptions.optional().default(() => {
        return {
          mode: 'inclusive' as const,
          excludeTables: [],
        };
      }),
      functions: functionOptions.optional().default(() => {
        return {
          mode: 'inclusive' as const,
          excludeFunctions: [],
          nullableArgs: false,
          nullableReturnTypes: true,
        };
      }),
      views: viewOptions.optional().default(() => {
        return {
          mode: 'inclusive' as const,
          excludeViews: [],
        };
      }),
      materializedViews: materializedViewOptions.optional().default(() => {
        return {
          mode: 'inclusive' as const,
          excludeMaterializedViews: [],
        };
      }),
    }),
  );

type IntrospeQLConfig = z.input<typeof introspeqlConfigSchema>;
type ParsedConfig = z.infer<typeof introspeqlConfigSchema>;

export { introspeqlConfigSchema, type IntrospeQLConfig, type ParsedConfig };
