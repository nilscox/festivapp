export function assert<T>(value: T, error = new Error('Assertion failed')): asserts value {
  if (!value) {
    throw error;
  }
}

export function defined<T>(value: T | null | undefined, error?: Error): T {
  assert(value != null, error);

  return value;
}
