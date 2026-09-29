/** "full-name" → "FullName". */
export function pascal(text: string): string {
  return text
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

/**
 * C# member name per test id. The page's most common prefix is stripped:
 * profile-country → Country, profile-save → Save, toast → Toast.
 */
export function memberNames(testIds: string[]): Map<string, string> {
  const counts = new Map<string, number>(); // a Map keeps first-seen order
  for (const id of testIds) {
    const first = id.split('-')[0];
    counts.set(first, (counts.get(first) ?? 0) + 1);
  }
  // Highest count wins; on a tie, the prefix seen first.
  let prefix = '';
  let count = 0;
  for (const [p, c] of counts) if (c > count) [prefix, count] = [p, c];

  const names = new Map<string, string>();
  for (const id of testIds) {
    const rest = count > 1 && id.startsWith(`${prefix}-`) ? id.slice(prefix.length + 1) : id;
    names.set(id, pascal(rest) || pascal(id));
  }
  return names;
}
