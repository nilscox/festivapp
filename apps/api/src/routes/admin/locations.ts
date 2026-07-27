import type { Location } from '@festivapp/contracts';
import { and, asc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../db/client.ts';
import { locations, type Location as LocationRow } from '../../db/schema.ts';

export const locationsRouter = Router({ mergeParams: true });

const createSchema = z.object({
  name: z.string().trim().min(1),
  position: z.number().int().min(0),
});

const updateSchema = createSchema.partial();

function toLocationDto(row: LocationRow): Location {
  return { id: row.id, name: row.name, position: row.position };
}

locationsRouter.get('/', async (req, res) => {
  const rows = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, req.tenant!.id))
    .orderBy(asc(locations.position), asc(locations.name));

  res.json(rows.map(toLocationDto) satisfies Location[]);
});

locationsRouter.post('/', async (req, res) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_body' });

    return;
  }

  const [row] = await db
    .insert(locations)
    .values({ tenantId: req.tenant!.id, name: parsed.data.name, position: parsed.data.position })
    .returning();

  res.status(201).json(toLocationDto(row!) satisfies Location);
});

locationsRouter.patch('/:id', async (req, res) => {
  const id = req.params.id;
  const parsed = updateSchema.safeParse(req.body);

  if (typeof id !== 'string' || !parsed.success) {
    res.status(400).json({ error: 'invalid_body' });

    return;
  }

  const [row] = await db
    .update(locations)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(locations.id, id), eq(locations.tenantId, req.tenant!.id)))
    .returning();

  if (!row) {
    res.status(404).json({ error: 'not_found' });

    return;
  }

  res.json(toLocationDto(row) satisfies Location);
});

locationsRouter.delete('/:id', async (req, res) => {
  const id = req.params.id;

  if (typeof id !== 'string') {
    res.status(404).json({ error: 'not_found' });

    return;
  }

  const [row] = await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.tenantId, req.tenant!.id)))
    .returning();

  if (!row) {
    res.status(404).json({ error: 'not_found' });

    return;
  }

  res.status(204).end();
});
