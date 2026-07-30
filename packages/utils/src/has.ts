export function has<Key extends PropertyKey, const Value>(key: Key, value: Value) {
  return <T extends Record<Key, unknown>>(obj: T): obj is Extract<T, Record<Key, Value>> => obj[key] === value;
}
