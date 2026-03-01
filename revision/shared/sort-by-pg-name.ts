export function sortByPGName<T extends { pgName: string }>(namedObjects: T[]) {
  return namedObjects.toSorted((a, b) => {
    return a.pgName.localeCompare(b.pgName);
  });
}
