export function assert<T>(value: T, error = new Error('Assertion failed')): asserts value {
  if (!value) {
    throw error;
  }
}
