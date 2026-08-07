import type { BootstrapResponse, Message, Participant, Session } from '@festivapp/contracts';
import { assert } from '@festivapp/utils';
import { Router } from 'express';

import type { Config } from '../../config.ts';
import type { Database } from '../../db/client.ts';

export function bootstrapRoutes({ config, db }: { config: Config; db: Database }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const tenant = req.tenant;
    assert(tenant);

    const [locationRows, participantRows, sessionRows, sessionParticipantRows, messageRows] = await Promise.all([
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
      db.query.messages.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
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
      imagePosition: { x: row.imageX, y: row.imageY },
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

    const messages: Message[] = messageRows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
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
      messages,
      pushPublicKey: config.vapidPublicKey ?? null,
    } satisfies BootstrapResponse);
  });

  return router;
}
