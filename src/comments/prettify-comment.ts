import synchronizedPrettier from '@prettier/sync';

export function prettifyComment(comment: string) {
  return synchronizedPrettier
    .format(comment, {
      parser: 'typescript',
      plugins: [require.resolve('prettier-plugin-jsdoc')],
      printWidth: 80,
      tsDoc: true,
      jsdocPreferCodeFences: true,
    })
    .trim();
}
