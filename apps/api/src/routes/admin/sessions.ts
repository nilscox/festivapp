import type { Session as SessionDto } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db, type Transaction } from '../../db/client.ts';
import { sessionParticipants, sessions, type Session } from '../../db/schema.ts';
import { falsyToNull } from '../../utils.ts';

export const sessionsRouter = Router({ mergeParams: true });

const sessionSchema = z
  .strictObject({
    locationId: z.string().trim().min(1),
    type: z.enum(['dj_set', 'live', 'talk', 'workshop', 'other']),
    title: z.string().max(200).trim().nullish().transform(falsyToNull),
    description: z.string().trim().nullish().transform(falsyToNull),
    participantIds: z.array(z.string().trim().min(1)),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
  })
  .check((ctx) => {
    if (ctx.value.endsAt <= ctx.value.startsAt) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.endsAt,
        path: ['endsAt'],
        message: 'A session must end after it starts.',
      });
    }

    if (!ctx.value.title && ctx.value.participantIds.length === 0) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.title,
        path: ['title'],
        message: 'A session with nobody on it needs a title.',
      });
    }

    if (new Set(ctx.value.participantIds).size !== ctx.value.participantIds.length) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.participantIds,
        path: ['participantIds'],
        message: 'A participant can only appear once on a session.',
      });
    }
  });

function toSessionDto(row: Session, participantIds: string[]): SessionDto {
  return {
    id: row.id,
    locationId: row.locationId,
    type: row.type,
    title: row.title,
    description: row.description,
    participantIds,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
  };
}

sessionsRouter.get('/', async (req, res) => {
  assert(req.tenant);

  const [rows, participantRows] = await Promise.all([
    db.query.sessions.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { startsAt: 'asc' },
    }),
    db.query.sessionParticipants.findMany({
      where: { session: { tenantId: req.tenant.id } },
      orderBy: { position: 'asc' },
    }),
  ]);

  const participantIds = new Map<string, string[]>();

  for (const { sessionId, participantId } of participantRows) {
    participantIds.set(sessionId, [...(participantIds.get(sessionId) ?? []), participantId]);
  }

  res.json(rows.map((row) => toSessionDto(row, participantIds.get(row.id) ?? [])));
});

sessionsRouter.post('/', async (req, res) => {
  assert(req.tenant);

  const { participantIds, ...values } = sessionSchema.parse(req.body);
  const tenantId = req.tenant.id;

  if (!(await ownsLocation(tenantId, values.locationId))) {
    return res.status(400).json({ error: 'unknown_location' });
  }

  if (!(await ownsParticipants(tenantId, participantIds))) {
    return res.status(400).json({ error: 'unknown_participant' });
  }

  const row = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(sessions)
      .values({
        ...values,
        tenantId,
        startsAt: new Date(values.startsAt),
        endsAt: new Date(values.endsAt),
      })
      .returning();

    await insertParticipants(tx, defined(row).id, participantIds);

    return defined(row);
  });

  res.status(201).json(toSessionDto(row, participantIds));
});

sessionsRouter.put('/:id', async (req, res) => {
  assert(req.tenant);

  const { participantIds, ...values } = sessionSchema.parse(req.body);
  const tenantId = req.tenant.id;

  if (!(await ownsLocation(tenantId, values.locationId))) {
    return res.status(400).json({ error: 'unknown_location' });
  }

  if (!(await ownsParticipants(tenantId, participantIds))) {
    return res.status(400).json({ error: 'unknown_participant' });
  }

  const row = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(sessions)
      .set({
        ...values,
        startsAt: new Date(values.startsAt),
        endsAt: new Date(values.endsAt),
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.id, req.params.id), eq(sessions.tenantId, tenantId)))
      .returning();

    if (!row) {
      return undefined;
    }

    await tx.delete(sessionParticipants).where(eq(sessionParticipants.sessionId, row.id));
    await insertParticipants(tx, row.id, participantIds);

    return row;
  });

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.json(toSessionDto(row, participantIds));
});

sessionsRouter.delete('/:id', async (req, res) => {
  assert(req.tenant);

  const [row] = await db
    .delete(sessions)
    .where(and(eq(sessions.id, req.params.id), eq(sessions.tenantId, req.tenant.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.status(204).end();
});

async function ownsLocation(tenantId: string, locationId: string) {
  const row = await db.query.locations.findFirst({ where: { id: locationId, tenantId } });

  return row !== undefined;
}

async function ownsParticipants(tenantId: string, participantIds: string[]) {
  if (participantIds.length === 0) {
    return true;
  }

  const rows = await db.query.participants.findMany({
    where: { tenantId, id: { in: participantIds } },
    columns: { id: true },
  });

  return rows.length === participantIds.length;
}

async function insertParticipants(tx: Transaction, sessionId: string, participantIds: string[]) {
  if (participantIds.length === 0) {
    return;
  }

  await tx
    .insert(sessionParticipants)
    .values(participantIds.map((participantId, position) => ({ sessionId, participantId, position })));
}
