export function roundPercent(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 100) * 10) / 10;
}
