import { EntityData } from '../config/entity-data';
import { Directives, getTokens } from '../shared';

interface ShouldIncludeRelationParams {
  name: string;
  schema: string;
  comment: string | null;
  mode: 'inclusive' | 'exclusive';
  exceptions: EntityData[];
}

export function shouldIncludeRelation({
  name,
  schema,
  comment,
  mode,
  exceptions,
}: ShouldIncludeRelationParams) {
  const tokens = getTokens(comment);

  if (mode === 'inclusive') {
    if (exceptions.some(e => e.schema === schema && e.name === name)) {
      return false;
    }

    if (tokens.some(t => t === Directives.Exclude)) {
      return false;
    }

    return true;
  }

  if (exceptions.some(e => e.schema === schema && e.name === name)) {
    return true;
  }

  if (tokens.some(t => t === Directives.Include)) {
    return true;
  }

  return false;
}
