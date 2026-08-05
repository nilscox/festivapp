import type { Message as MessageDto } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { messages, type Message } from '../../db/schema.ts';

export const messagesRouter = Router({ mergeParams: true });

const createSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  notify: z.boolean().default(false),
});

const updateSchema = createSchema.omit({ notify: true }).partial();

function toMessageDto(row: Message): MessageDto {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

messagesRouter.get('/', async (req, res) => {
  const db = req.container.resolve('db');

  assert(req.tenant);

  const rows = await db.query.messages.findMany({
    where: { tenantId: req.tenant.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(rows.map(toMessageDto));
});

messagesRouter.post('/', async (req, res) => {
  const db = req.container.resolve('db');
  const push = req.container.resolve('push');
  const logger = req.container.resolve('logger');

  assert(req.tenant);

  const tenantId = req.tenant.id;
  const { notify, ...values } = createSchema.parse(req.body);

  const [row] = await db
    .insert(messages)
    .values({
      tenantId,
      ...values,
    })
    .returning();

  res.status(201).json(toMessageDto(defined(row)));

  if (notify) {
    void push.sendToTenant(tenantId, { title: values.title, body: values.body }).catch((error: unknown) => {
      logger.error('failed to notify a festival', { tenantId, error });
    });
  }
});

messagesRouter.patch('/:id', async (req, res) => {
  const db = req.container.resolve('db');

  assert(req.tenant);

  const values = updateSchema.parse(req.body);

  const [row] = await db
    .update(messages)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(and(eq(messages.id, req.params.id), eq(messages.tenantId, req.tenant.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.json(toMessageDto(row));
});

messagesRouter.delete('/:id', async (req, res) => {
  const db = req.container.resolve('db');

  assert(req.tenant);

  const [row] = await db
    .delete(messages)
    .where(and(eq(messages.id, req.params.id), eq(messages.tenantId, req.tenant.id)))
    .returning();

  if (!row) {
    return res.status(404).json({ error: 'not_found' });
  }

  res.status(204).end();
});
