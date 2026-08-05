import { customAlphabet } from 'nanoid';
import { z } from 'zod';

const alphabet = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789'].join('');

export const createId = customAlphabet(alphabet, 8);

export function falsyToNull<T>(value: T) {
  return value || null;
}

export function optionalString() {
  return z.string().trim().nullish().transform(falsyToNull);
}
