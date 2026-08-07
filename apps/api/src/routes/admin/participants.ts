import type { Participant as ParticipantDto } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { participants, type Participant } from '../../db/schema.ts';
import { filterEmptyStrings, optionalString } from '../../utils.ts';

import type { Database } from '../../db/client.ts';

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalString(),
  imageUrl: optionalString(),
  imagePosition: z
    .strictObject({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
  origin: optionalString(),
  label: optionalString(),
  styles: z.array(z.string().trim().max(25)).transform(filterEmptyStrings).optional(),
  socialLinks: z.array(z.string().trim().max(400)).transform(filterEmptyStrings).pipe(z.array(z.url())).optional(),
});

const updateSchema = createSchema.partial();

export function participantsRoutes({ db }: { db: Database }) {
  const router = Router({ mergeParams: true });

  router.get('/', async (req, res) => {
    assert(req.tenant);

    const rows = await db.query.participants.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { name: 'asc' },
    });

    res.json(rows.map(toParticipantDto));
  });

  router.post('/', async (req, res) => {
    assert(req.tenant);

    const { imagePosition, ...values } = createSchema.parse(req.body);

    const [row] = await db
      .insert(participants)
      .values({
        tenantId: req.tenant.id,
        ...values,
        imageX: imagePosition?.x,
        imageY: imagePosition?.y,
      })
      .returning();

    res.status(201).json(toParticipantDto(defined(row)));
  });

  router.patch('/:id', async (req, res) => {
    assert(req.tenant);

    const { imagePosition, ...values } = updateSchema.parse(req.body);

    const [row] = await db
      .update(participants)
      .set({
        ...values,
        imageX: imagePosition?.x,
        imageY: imagePosition?.y,
        updatedAt: new Date(),
      })
      .where(and(eq(participants.id, req.params.id), eq(participants.tenantId, req.tenant.id)))
      .returning();

    if (!row) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json(toParticipantDto(row));
  });

  router.delete('/:id', async (req, res) => {
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

  return router;
}

function toParticipantDto(row: Participant): ParticipantDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    imagePosition: { x: row.imageX, y: row.imageY },
    origin: row.origin,
    label: row.label,
    styles: row.styles,
    socialLinks: row.socialLinks,
  };
}
