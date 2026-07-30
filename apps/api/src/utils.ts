import { customAlphabet } from 'nanoid';

const alphabet = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789'].join('');

export const createId = customAlphabet(alphabet, 8);

export function assert<T>(value: T, error = new Error('Assertion failed')): asserts value {
  if (!value) {
    throw error;
  }
}
