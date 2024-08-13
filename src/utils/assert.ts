export function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) {
    // debugger;
    throw new Error(message);
  }
}

export function defined<T>(value: T | undefined): T {
  assert(value);
  return value;
}
