/**
 * Converts snake_case to PascalCase, preserving one leading underscore, if
 * present.
 *
 * @param str - A snake_case string.
 * @returns A PascalCase string.
 */
export function snakeCaseToPascalCase(str: string) {
  let formatted = str
    .split("_")
    .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
    .join("");

  if (str.startsWith("_")) {
    formatted = "_" + formatted;
  }

  return formatted;
}
