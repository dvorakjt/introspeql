import type { EnumData } from './enum-data';
import type { ParsedConfig } from '../config';

export function isEnumReplacedWithCustomType(
  enumData: EnumData,
  config: ParsedConfig,
) {
  const enumIdentifier = enumData.schema + '.' + enumData.name;
  const customTypeIdentifiers = Object.keys(config.types);
  const enumIsReplacedWithCustomType =
    customTypeIdentifiers.includes(enumIdentifier);
  return enumIsReplacedWithCustomType;
}
