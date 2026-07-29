import type { Location as LocationDto } from '@festivapp/contracts';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../db/client.ts';
import { locations, type Location } from '../../db/schema.ts';
import { assert } from '../../utils.ts';

export const locationsRouter = Router({ mergeParams: true });

const createSchema = z.strictObject({
  name: z.string().trim().min(1),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((value) => value || null),
  position: z.number().int().min(0),
});

const updateSchema = createSchema
  .extend({
    mapPin: z
      .strictObject({
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        labelPosition: z.enum(['top', 'bottom', 'left', 'right']).optional(),
      })
      .optional(),
  })
  .partial();

function toLocationDto(row: Location): LocationDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    position: row.position,
    mapPin: { x: row.mapX, y: row.mapY, labelPosition: row.mapLabelPosition },
  };
}

locationsRouter.get('/', async (req, res) => {
  assert(req.tenant);

  const locations = await db.query.locations.findMany({
    where: { tenantId: req.tenant.id },
    orderBy: { position: 'asc' },
  });

  res.json(locations.map(toLocationDto));
});

locationsRouter.post('/', async (req, res) => {
  assert(req.tenant);

  const values = createSchema.parse(req.body);

  const [row] = await db
    .insert(locations)
    .values({
      tenantId: req.tenant.id,
      ...values,
    })
    .returning();

  res.status(201).json(toLocationDto(row!));
});

locationsRouter.patch('/:id', async (req, res) => {
  assert(req.tenant);

  const { mapPin, ...values } = updateSchema.parse(req.body);

  const [row] = await db
    .update(locations)
    .set({
      ...values,
      mapX: mapPin?.x,
      mapY: mapPin?.y,
      mapLabelPosition: mapPin?.labelPosition,
      updatedAt: new Date(),
    })
    .where(and(eq(locations.id, req.params.id), eq(locations.tenantId, req.tenant.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.json(toLocationDto(row));
});

locationsRouter.delete('/:id', async (req, res) => {
  assert(req.tenant);

  const [row] = await db
    .delete(locations)
    .where(and(eq(locations.id, req.params.id), eq(locations.tenantId, req.tenant!.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.status(204).end();
});
