import type { MeResponse, Organizer as OrganizerDto, TenantSummary as TenantDto } from '@festivapp/contracts';
import { Router } from 'express';
import { z } from 'zod';

import { verifyPassword } from '../../auth/password.ts';
import {
  clearCookieOptions,
  createSession,
  destroySession,
  readSessionToken,
  sessionCookieOptions,
} from '../../auth/session.ts';
import { db } from '../../db/client.ts';
import { type Organizer, type Tenant } from '../../db/schema.ts';
import { requireOrganizer } from '../../middleware/admin-auth.ts';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

async function listOrganizerTenants(organizerId: string) {
  return db.query.tenants.findMany({
    where: { organizers: { id: organizerId } },
    orderBy: { name: 'asc' },
  });
}

function toOrganizerDto(organizer: Organizer): OrganizerDto {
  return { id: organizer.id, email: organizer.email, name: organizer.name };
}

function toTenantDto(tenant: Tenant): TenantDto {
  return { id: tenant.id, name: tenant.name, domain: tenant.domain };
}

authRouter.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const organizer = await db.query.organizers.findFirst({
    where: { email },
  });

  if (!organizer || !verifyPassword(password, organizer.passwordHash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const { token, expiresAt } = await createSession(organizer.id);
  const tenants = await listOrganizerTenants(organizer.id);

  res.cookie('token', token, sessionCookieOptions(expiresAt));

  res.json({
    organizer: toOrganizerDto(organizer),
    tenants: tenants.map(toTenantDto),
  } satisfies MeResponse);
});

authRouter.get('/me', requireOrganizer, async (req, res) => {
  const organizer = req.organizer!;
  const tenants = await listOrganizerTenants(organizer.id);

  res.json({
    organizer: toOrganizerDto(organizer),
    tenants: tenants.map(toTenantDto),
  } satisfies MeResponse);
});

authRouter.post('/logout', requireOrganizer, async (req, res) => {
  const token = readSessionToken(req);

  if (token !== undefined) {
    await destroySession(token);
  }

  res.clearCookie('token', clearCookieOptions());
  res.status(204).end();
});
