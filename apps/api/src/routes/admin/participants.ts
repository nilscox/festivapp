import type { Participant as ParticipantDto } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../db/client.ts';
import { participants, type Participant } from '../../db/schema.ts';
import { falsyToNull } from '../../utils.ts';

export const participantsRouter = Router({ mergeParams: true });

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().nullish().transform(falsyToNull),
  imageUrl: z.string().trim().nullish().transform(falsyToNull),
  origin: z.string().trim().nullish().transform(falsyToNull),
  label: z.string().trim().nullish().transform(falsyToNull),
  styles: z.array(z.string().trim().min(1).max(30)).optional(),
  socialLinks: z.array(z.url().trim().min(1).max(400)).optional(),
});

const updateSchema = createSchema.partial();

function toParticipantDto(row: Participant): ParticipantDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    origin: row.origin,
    label: row.label,
    styles: row.styles,
    socialLinks: row.socialLinks,
  };
}

participantsRouter.get('/', async (req, res) => {
  assert(req.tenant);

  const rows = await db.query.participants.findMany({
    where: { tenantId: req.tenant.id },
    orderBy: { name: 'asc' },
  });

  res.json(rows.map(toParticipantDto));
});

participantsRouter.post('/', async (req, res) => {
  assert(req.tenant);

  const values = createSchema.parse(req.body);

  const [row] = await db
    .insert(participants)
    .values({
      tenantId: req.tenant.id,
      ...values,
    })
    .returning();

  res.status(201).json(toParticipantDto(defined(row)));
});

participantsRouter.patch('/:id', async (req, res) => {
  assert(req.tenant);

  const values = updateSchema.parse(req.body);

  const [row] = await db
    .update(participants)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(participants.id, req.params.id), eq(participants.tenantId, req.tenant.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.json(toParticipantDto(row));
});

participantsRouter.delete('/:id', async (req, res) => {
  assert(req.tenant);

  const [row] = await db
    .delete(participants)
    .where(and(eq(participants.id, req.params.id), eq(participants.tenantId, req.tenant.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.status(204).end();
});
