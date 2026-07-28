import type { UploadedFile as FileDto, TenantTheme } from '@festivapp/contracts';
import { and, eq } from 'drizzle-orm';
import express, { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { config } from '../../config.ts';
import { db } from '../../db/client.ts';
import { files, type File } from '../../db/schema.ts';
import { storage } from '../../storage.ts';
import { assert } from '../../utils.ts';

export const filesRouter = Router({ mergeParams: true });

const extensions: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

function fileUrl(id: string): string {
  return `/files/${id}`;
}

function isUsedByTheme(theme: TenantTheme, url: string): boolean {
  return theme.logo.wordmarkUrl === url || theme.logo.iconUrl === url || theme.backgroundImage?.url === url;
}

function toFileDto(row: File): FileDto {
  return {
    id: row.id,
    name: row.name,
    contentType: row.contentType,
    size: row.size,
    url: fileUrl(row.id),
    createdAt: row.createdAt.toISOString(),
  };
}

filesRouter.get('/', async (req, res) => {
  assert(req.tenant);

  const rows = await db.query.files.findMany({
    where: { tenantId: req.tenant.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(rows.map(toFileDto));
});

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
});

filesRouter.post(
  '/',
  express.raw({ type: Object.keys(extensions), limit: config.uploadMaxBytes }),
  async (req, res) => {
    assert(req.tenant);

    const { name } = uploadSchema.parse(req.query);
    const contentType = req.get('content-type')?.split(';')[0]?.trim() ?? '';
    const extension = extensions[contentType];

    if (!Buffer.isBuffer(req.body) || extension === undefined) {
      return res.status(415).json({ error: 'unsupported_media_type' });
    }

    const size = req.body.length;

    if (size === 0) {
      return res.status(400).json({ error: 'empty_file' });
    }

    const id = randomUUID();
    const storageKey = `${req.tenant.id}/${id}${extension}`;

    await storage.put(storageKey, req.body);

    const [row] = await db
      .insert(files)
      .values({
        id,
        tenantId: req.tenant.id,
        storageKey,
        name,
        contentType,
        size,
      })
      .returning();

    assert(row);

    res.status(201).json(toFileDto(row));
  },
);

filesRouter.delete('/:id', async (req, res) => {
  assert(req.tenant);

  const file = await db.query.files.findFirst({
    where: { id: req.params.id, tenantId: req.tenant.id },
  });

  if (!file) {
    return res.status(404).json({ error: 'not_found' });
  }

  if (isUsedByTheme(req.tenant.theme, fileUrl(file.id))) {
    return res.status(409).json({ error: 'file_in_use' });
  }

  await db.delete(files).where(and(eq(files.id, file.id), eq(files.tenantId, req.tenant.id)));
  await storage.delete(file.storageKey);

  res.status(204).end();
});
