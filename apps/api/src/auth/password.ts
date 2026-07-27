import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, KEY_LENGTH);

  return `scrypt$${salt.toString('base64')}$${derived.toString('base64')}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split('$');

  if (scheme !== 'scrypt' || saltB64 === undefined || hashB64 === undefined) {
    return false;
  }

  const expected = Buffer.from(hashB64, 'base64');
  const derived = scryptSync(plain, Buffer.from(saltB64, 'base64'), expected.length);

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
