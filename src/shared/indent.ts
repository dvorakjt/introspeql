export function indent(str: string, spaces: number) {
  return str
    .split('\n')
    .map(line => ' '.repeat(spaces) + line)
    .join('\n');
}
