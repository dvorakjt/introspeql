export function getTokens(comment: string | null) {
  const tokens = comment ? comment.split(/\s/).map(t => t.toLowerCase()) : [];
  return tokens;
}
