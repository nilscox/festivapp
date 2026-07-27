import { add } from 'date-fns';
import { eq } from 'drizzle-orm';
import type { CookieOptions, Request } from 'express';
import { randomBytes } from 'node:crypto';

import { db } from '../db/client.ts';
import { authSessions } from '../db/schema.ts';

export async function createSession(organizerId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(add(Date.now(), { months: 3 }));

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

    if (part.slice(0, splitAt).trim() === 'token') {
      return decodeURIComponent(part.slice(splitAt + 1).trim());
    }
  }

  return undefined;
}

const secure = process.env.NODE_ENV === 'production';

export function sessionCookieOptions(expires: Date): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path: '/', secure, expires };
}

export function clearCookieOptions(): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path: '/', secure };
}
