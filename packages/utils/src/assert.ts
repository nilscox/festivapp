export function assert<T>(value: T, error?: Error): asserts value {
  if (!value) {
    throw error ?? new Error('Assertion failed');
  }
}

export function defined<T>(value: T | null | undefined, error?: Error): T {
  assert(value != null, error);

  return value;
}
