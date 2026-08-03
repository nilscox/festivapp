export function unique<T>(entries: Iterable<T>): T[] {
  return Array.from(new Set(entries));
}
