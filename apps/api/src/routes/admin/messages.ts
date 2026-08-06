import type { Message as MessageDto } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { messages, type Message } from '../../db/schema.ts';

import type { Database } from '../../db/client.ts';
import type { Logger } from '../../logger.ts';
import type { Push } from '../../push.ts';

const createSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  notify: z.boolean().default(false),
});

const updateSchema = createSchema.omit({ notify: true }).partial();

export function messagesRoutes({ logger, db, push }: { logger: Logger; db: Database; push: Push }) {
  const router = Router({ mergeParams: true });

  router.get('/', async (req, res) => {
    assert(req.tenant);

    const rows = await db.query.messages.findMany({
      where: { tenantId: req.tenant.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json(rows.map(toMessageDto));
  });

  router.post('/', async (req, res) => {
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

  router.patch('/:id', async (req, res) => {
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

  router.delete('/:id', async (req, res) => {
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

  return router;
}

function toMessageDto(row: Message): MessageDto {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}
