import type { BootstrapResponse, Participant, Session } from '@festivapp/contracts';
import { asc, eq } from 'drizzle-orm';
import { Router } from 'express';

import { db } from '../../db/client.ts';
import * as schema from '../../db/schema.ts';
import { assert } from '../../utils.ts';

export const bootstrapRouter = Router();

bootstrapRouter.get('/bootstrap', async (req, res) => {
  const tenant = req.tenant;
  assert(tenant);

  const [locationRows, participantRows, sessionRows, linkRows] = await Promise.all([
    db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.tenantId, tenant.id))
      .orderBy(asc(schema.locations.position)),
    db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.tenantId, tenant.id))
      .orderBy(asc(schema.participants.name)),
    db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.tenantId, tenant.id))
      .orderBy(asc(schema.sessions.startsAt)),
    db
      .select()
      .from(schema.sessionParticipants)
      .innerJoin(schema.sessions, eq(schema.sessionParticipants.sessionId, schema.sessions.id))
      .where(eq(schema.sessions.tenantId, tenant.id))
      .orderBy(asc(schema.sessionParticipants.position)),
  ]);

  const sessionParticipantIds = new Map<string, Set<string>>();

  for (const { session_participants: link } of linkRows) {
    if (!sessionParticipantIds.has(link.sessionId)) {
      sessionParticipantIds.set(link.sessionId, new Set());
    }

    sessionParticipantIds.get(link.sessionId)?.add(link.participantId);
  }

  const participants: Participant[] = participantRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    origin: row.origin,
    label: row.label,
    styles: row.styles,
    socialLinks: row.socialLinks,
  }));

  const sessions: Session[] = sessionRows.map((row) => ({
    id: row.id,
    locationId: row.locationId,
    type: row.type,
    title: row.title,
    description: row.description,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    participantIds: Array.from(sessionParticipantIds.get(row.id) ?? []),
  }));

  res.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      timezone: tenant.timezone,
      theme: tenant.theme,
    },
    locations: locationRows.map((row) => ({
      id: row.id,
      name: row.name,
      position: row.position,
    })),
    participants,
    sessions,
  } satisfies BootstrapResponse);
});
