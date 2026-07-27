import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(plain, salt, 64);

  return `${derived.toString('hex')}.${salt}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [hashed, salt] = stored.split('.') as [string, string];
  const expected = Buffer.from(hashed, 'hex');
  const derived = scryptSync(plain, salt, 64);

  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
