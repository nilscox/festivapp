export type Extend<A, B> = Omit<A, keyof B> & B;

export function assert<T>(value: T | null | undefined, error = new Error('Assertion failed')): asserts value {
  if (value == null) {
    throw error;
  }
}

export function defined<T>(value: T | null | undefined, error = new Error('Assertion failed')): T {
  assert(value, error);
  return value;
}
