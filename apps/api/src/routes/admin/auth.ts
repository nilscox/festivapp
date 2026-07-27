import type { MeResponse } from '@festivapp/contracts';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { verifyPassword } from '../../auth/password.ts';
import {
  clearCookieOptions,
  createSession,
  destroySession,
  readSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../../auth/session.ts';
import { db } from '../../db/client.ts';
import { organizers } from '../../db/schema.ts';
import { requireOrganizer } from '../../middleware/admin-auth.ts';
import { listOrganizerTenants, toOrganizerDto } from './tenants.ts';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body' });

    return;
  }

  const email = parsed.data.email.trim().toLowerCase();

  const [organizer] = await db.select().from(organizers).where(eq(organizers.email, email)).limit(1);

  if (!organizer || !verifyPassword(parsed.data.password, organizer.passwordHash)) {
    res.status(401).json({ error: 'invalid_credentials' });

    return;
  }

  const { token, expiresAt } = await createSession(organizer.id);

  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

  res.json({
    organizer: toOrganizerDto(organizer),
    tenants: await listOrganizerTenants(organizer.id),
  } satisfies MeResponse);
});

authRouter.get('/me', requireOrganizer, async (req, res) => {
  const organizer = req.organizer!;

  res.json({
    organizer: toOrganizerDto(organizer),
    tenants: await listOrganizerTenants(organizer.id),
  } satisfies MeResponse);
});

authRouter.post('/logout', requireOrganizer, async (req, res) => {
  const token = readSessionToken(req);

  if (token !== undefined) {
    await destroySession(token);
  }

  res.clearCookie(SESSION_COOKIE, clearCookieOptions());
  res.status(204).end();
});
