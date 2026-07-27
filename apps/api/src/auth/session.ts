import { eq } from 'drizzle-orm';
import type { CookieOptions, Request } from 'express';
import { randomBytes } from 'node:crypto';

import { db } from '../db/client.ts';
import { authSessions } from '../db/schema.ts';

export const SESSION_COOKIE = 'festivapp_admin_session';

const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const isProd = process.env.NODE_ENV === 'production';

export async function createSession(organizerId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(authSessions).values({ token, organizerId, expiresAt });

  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(authSessions).where(eq(authSessions.token, token));
}

export function readSessionToken(req: Request): string | undefined {
  const header = req.headers.cookie;

  if (header === undefined) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const splitAt = part.indexOf('=');

    if (splitAt === -1) {
      continue;
    }

    if (part.slice(0, splitAt).trim() === SESSION_COOKIE) {
      return decodeURIComponent(part.slice(splitAt + 1).trim());
    }
  }

  return undefined;
}

export function sessionCookieOptions(expiresAt: Date): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path: '/', secure: isProd, expires: expiresAt };
}

export function clearCookieOptions(): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path: '/', secure: isProd };
}
