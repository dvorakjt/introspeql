import { Directives, getTokens } from '../shared';
import type { ParsedConfig } from '../config';

export function shouldIncludeOverload(
  schema: string,
  name: string,
  comment: string | null,
  config: ParsedConfig,
) {
  const tokens = getTokens(comment);

  /*
    If mode is inclusive, include the overload only if it AND the function 
    itself are not marked for exclusion.
  */
  if (config.functions.mode === 'inclusive') {
    const shouldExcludeFunction = config.functions.excludeFunctions.some(
      f => f.schema === schema && f.name === name,
    );

    const shouldExcludeOverload = tokens.some(t => t === Directives.Exclude);

    return !shouldExcludeFunction && !shouldExcludeOverload;
  }

  /*
    If mode is exclusive, include the overload if either it OR the function 
    itself are marked for inclusion.
  */
  const shouldIncludeFunction = config.functions.includeFunctions.some(
    f => f.schema === schema && f.name === name,
  );

  const shouldIncludeOverload = tokens.some(t => t === Directives.Include);

  return shouldIncludeFunction || shouldIncludeOverload;
}
