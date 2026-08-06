import { defined, get } from '@festivapp/utils';
import { eq } from 'drizzle-orm';
import type { PgInsertValue, PgTable } from 'drizzle-orm/pg-core';
import { readFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import z from 'zod';

import * as schema from './db/schema.ts';
import { themeSchema } from './theme.ts';
import { createId } from './utils.ts';

import type { Database } from './db/client.ts';
import type { Logger } from './logger.ts';
import type { Storage } from './storage.ts';

const contentTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

const dataSchema = z.strictObject({
  tenant: z.strictObject({
    name: z.string(),
    domain: z.string(),
    timezone: z.string(),
    map: z.string().nullish(),
    theme: z.strictObject({
      ...themeSchema.shape,
      logo: z
        .strictObject({
          wordmark: z.string().optional(),
          icon: z.string().optional(),
        })
        .optional(),
      backgroundImage: z
        .strictObject({
          path: z.string(),
          opacity: z.number().min(0).max(1),
        })
        .optional(),
    }),
  }),
  locations: z.array(
    z.strictObject({
      name: z.string().min(1),
      description: z.string(),
      mapPin: z
        .strictObject({
          x: z.number().min(0).max(100),
          y: z.number().min(0).max(100),
        })
        .optional(),
    }),
  ),
  participants: z.array(
    z.strictObject({
      name: z.string(),
      image: z.string().nullable(),
      styles: z.array(z.string()),
      label: z.string().nullable(),
      origin: z.string().nullable(),
      description: z.string().nullable(),
      socialLinks: z.array(z.string()),
    }),
  ),
  sessions: z.array(
    z.strictObject({
      title: z.string().nullable(),
      type: z.enum(['live', 'dj_set', 'talk', 'workshop', 'other']),
      location: z.string(),
      start: z.iso.datetime(),
      end: z.iso.datetime(),
      description: z.string().nullable(),
      participants: z.array(z.string()).min(1),
    }),
  ),
  messages: z.array(
    z.strictObject({
      title: z.string().min(1),
      body: z.string().min(1),
      date: z.iso.datetime(),
    }),
  ),
});

export async function seed(
  { logger, db, storage }: { logger: Logger; db: Database; storage: Storage },
  input: string,
  drop = false,
): Promise<void> {
  const data = dataSchema.parse(JSON.parse(await readFile(input, 'utf8')));

  const tenantId = createId();

  const files = new Array<typeof schema.files.$inferInsert>();
  const locations = new Array<typeof schema.locations.$inferInsert>();
  const participants = new Array<typeof schema.participants.$inferInsert>();
  const sessions = new Array<typeof schema.sessions.$inferInsert>();
  const sessionParticipants = new Array<typeof schema.sessionParticipants.$inferInsert>();
  const messages = new Array<typeof schema.messages.$inferInsert>();

  const locationsMap = new Map<string, string>();
  const participantsMap = new Map<string, string>();

  const existing = await db.query.tenants.findFirst({
    where: { domain: data.tenant.domain },
  });

  if (existing) {
    if (!drop) {
      throw new Error(`Domain "${data.tenant.domain}" is already taken`);
    }

    const files = await db.query.files.findMany({
      where: { tenantId: existing.id },
    });

    await db.delete(schema.tenants).where(eq(schema.tenants.domain, data.tenant.domain));

    await Promise.all(files.map(get('storageKey')).map(deleteFile));
  }

  try {
    const tenant = {
      id: tenantId,
      name: data.tenant.name,
      domain: data.tenant.domain,
      timezone: data.tenant.timezone,
      mapUrl: await uploadFile(data.tenant.map),
      theme: {
        ...data.tenant.theme,
        logo: {
          iconUrl: await uploadFile(data.tenant.theme.logo?.icon),
          wordmarkUrl: await uploadFile(data.tenant.theme.logo?.wordmark),
        },
        backgroundImage: data.tenant.theme.backgroundImage
          ? {
              url: await uploadFile(data.tenant.theme.backgroundImage.path),
              opacity: data.tenant.theme.backgroundImage.opacity,
            }
          : null,
      },
    };

    for (const [index, location] of data.locations.entries()) {
      const id = createId();

      locationsMap.set(location.name, id);

      locations.push({
        id,
        tenantId,
        name: location.name,
        description: location.description,
        position: index + 1,
        mapX: location.mapPin?.x,
        mapY: location.mapPin?.y,
      });
    }

    for (const { image, ...participant } of data.participants) {
      const id = createId();

      participantsMap.set(participant.name, id);

      participants.push({
        id,
        tenantId,
        imageUrl: await uploadFile(image),
        ...participant,
      });
    }

    for (const session of data.sessions) {
      const id = createId();

      sessions.push({
        id,
        tenantId,
        locationId: defined(locationsMap.get(session.location)),
        type: session.type,
        title: session.title,
        startsAt: new Date(session.start),
        endsAt: new Date(session.end),
        description: session.description,
      });

      let position = 1;

      for (const participant of session.participants) {
        sessionParticipants.push({
          sessionId: id,
          participantId: defined(participantsMap.get(participant)),
          position: position++,
        });
      }
    }

    for (const message of data.messages) {
      messages.push({
        id: createId(),
        tenantId,
        title: message.title,
        body: message.body,
        createdAt: new Date(message.date),
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(schema.tenants).values(tenant);

      await insertMany(schema.files, files);
      await insertMany(schema.locations, locations);
      await insertMany(schema.participants, participants);
      await insertMany(schema.sessions, sessions);
      await insertMany(schema.sessionParticipants, sessionParticipants);
      await insertMany(schema.messages, messages);

      async function insertMany<Table extends PgTable>(table: Table, values: Array<PgInsertValue<Table>>) {
        if (values.length > 0) {
          await tx.insert(table).values(values);
        }
      }
    });
  } catch (error) {
    await Promise.all(files.map(get('storageKey')).map(deleteFile));
    await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
    throw error;
  }

  async function uploadFile(path: string): Promise<string>;
  async function uploadFile(path: string | null | undefined): Promise<string | null>;
  async function uploadFile(path: string | null | undefined) {
    if (path == null) {
      return null;
    }

    const extension = extname(path).toLowerCase();
    const contentType = contentTypes[extension];

    if (contentType === undefined) {
      throw new Error(`Unsupported image type: ${path}`);
    }

    const id = createId();
    const storageKey = `${tenantId}/${id}${extension}`;
    const content = await readFile(resolve(dirname(input), path));

    await storage.put(storageKey, content);

    files.push({
      id,
      tenantId,
      storageKey,
      name: basename(path),
      contentType,
      size: content.length,
    });

    return `/files/${id}`;
  }

  async function deleteFile(storageKey: string) {
    await storage.delete(storageKey).catch((error: unknown) => {
      logger.error('failed to delete an orphaned upload', { storageKey, error });
    });
  }
}
