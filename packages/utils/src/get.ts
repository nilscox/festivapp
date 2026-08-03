export function get<Key extends PropertyKey>(key: Key) {
  return <T extends Record<Key, unknown>>(obj: T): T[Key] => obj[key];
}
