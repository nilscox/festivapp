import type { UploadedFile as FileDto, TenantTheme } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { and, eq } from 'drizzle-orm';
import express, { Router, type RequestHandler } from 'express';
import { z } from 'zod';

import { files, type File } from '../../db/schema.ts';
import { createId } from '../../utils.ts';

import type { Config } from '../../config.ts';
import type { Database } from '../../db/client.ts';
import type { Storage } from '../../storage.ts';

const extensions: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
};

export function filesRoutes({ config, db, storage }: { config: Config; db: Database; storage: Storage }) {
  const router = Router({ mergeParams: true });

  router.get('/', async (req, res) => {
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

  const uploadBody: RequestHandler = (req, res, next) => {
    const raw = express.raw({ type: Object.keys(extensions), limit: config.uploadMaxBytes });

    return raw(req, res, next);
  };

  router.post('/', uploadBody, async (req, res) => {
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

    const id = createId();
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

    res.status(201).json(toFileDto(defined(row)));
  });

  router.delete('/:id', async (req, res) => {
    assert(req.tenant);

    const file = await db.query.files.findFirst({
      where: { id: req.params.id, tenantId: req.tenant.id },
    });

    if (!file) {
      return res.status(404).json({ error: 'not_found' });
    }

    const url = fileUrl(file.id);

    const participant = await db.query.participants.findFirst({
      where: { tenantId: req.tenant.id, imageUrl: url },
    });

    if (req.tenant.mapUrl === url || isUsedByTheme(req.tenant.theme, url) || participant) {
      return res.status(409).json({ error: 'file_in_use' });
    }

    await db.delete(files).where(and(eq(files.id, file.id), eq(files.tenantId, req.tenant.id)));
    await storage.delete(file.storageKey);

    res.status(204).end();
  });

  return router;
}

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
