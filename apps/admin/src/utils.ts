export function assert<T>(value: T, error = new Error('Assertion failed')): asserts value {
  if (!value) {
    throw error;
  }
}

export function defined<T>(value: T | null | undefined, error?: Error): T {
  assert(value != null, error);
  return value;
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(fields.filter(Boolean).join(' '));

  return terms.every((term) => haystack.includes(term));
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
