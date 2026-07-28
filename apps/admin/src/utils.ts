export function assert<T>(value: T, error = new Error('Assertion failed')): asserts value {
  if (!value) {
    throw error;
  }
}

export function defined<T>(value: T | null | undefined, error?: Error): T {
  assert(value != null, error);
  return value;
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
