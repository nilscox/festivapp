import { customAlphabet } from 'nanoid';

const alphabet = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz', '0123456789'].join('');

export const createId = customAlphabet(alphabet, 8);
