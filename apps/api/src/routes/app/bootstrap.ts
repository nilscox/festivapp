import type { BootstrapResponse, Participant, Session } from '@festivapp/contracts';
import { assert } from '@festivapp/utils';
import { Router } from 'express';

import { db } from '../../db/client.ts';

export const bootstrapRouter = Router();

bootstrapRouter.get('/bootstrap', async (req, res) => {
  const tenant = req.tenant;
  assert(tenant);

  const [locationRows, participantRows, sessionRows, sessionParticipantRows] = await Promise.all([
    db.query.locations.findMany({
      where: { tenantId: tenant.id },
      orderBy: { position: 'asc' },
    }),
    db.query.participants.findMany({
      where: { tenantId: tenant.id },
      orderBy: { name: 'asc' },
    }),
    db.query.sessions.findMany({
      where: { tenantId: tenant.id },
      orderBy: { startsAt: 'asc' },
    }),
    db.query.sessionParticipants.findMany({
      where: { session: { tenantId: tenant.id } },
      orderBy: { position: 'asc' },
    }),
  ]);

  const sessionParticipantIds = new Map<string, Set<string>>();

  for (const { sessionId, participantId } of sessionParticipantRows) {
    if (!sessionParticipantIds.has(sessionId)) {
      sessionParticipantIds.set(sessionId, new Set());
    }

    sessionParticipantIds.get(sessionId)?.add(participantId);
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
      mapUrl: tenant.mapUrl,
      theme: tenant.theme,
    },
    locations: locationRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      position: row.position,
      mapPin: {
        x: row.mapX,
        y: row.mapY,
        labelPosition: row.mapLabelPosition,
      },
    })),
    participants,
    sessions,
  } satisfies BootstrapResponse);
});
