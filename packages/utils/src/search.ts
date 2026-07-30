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
