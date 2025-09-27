export function snakeCaseToPascalCase(str: string) {
  return str
    .split("_")
    .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
    .join("");
}
