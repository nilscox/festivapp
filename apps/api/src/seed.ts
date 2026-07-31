import { defined } from '@festivapp/utils';
import { eq } from 'drizzle-orm';
import fs from 'node:fs/promises';
import path from 'node:path';
import z from 'zod';

import { db } from './db/client.ts';
import * as schema from './db/schema.ts';
import { storage } from './storage.ts';
import { themeSchema } from './theme.ts';
import { createId } from './utils.ts';

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
});

export async function seed(input: string, drop = false): Promise<void> {
  const data = dataSchema.parse(JSON.parse(await fs.readFile(input, 'utf8')));

  const tenantId = createId();

  const files = new Array<typeof schema.files.$inferInsert>();
  const participants = new Array<typeof schema.participants.$inferInsert>();
  const locations = new Array<typeof schema.locations.$inferInsert>();
  const sessions = new Array<typeof schema.sessions.$inferInsert>();
  const sessionParticipants = new Array<typeof schema.sessionParticipants.$inferInsert>();

  const locationsMap = new Map<string, string>();
  const participantsMap = new Map<string, string>();

  const filesToUpload = new Map<string, Buffer>();

  const theme = data.tenant.theme;

  const tenant: typeof schema.tenants.$inferInsert = {
    id: tenantId,
    name: data.tenant.name,
    domain: data.tenant.domain,
    timezone: data.tenant.timezone,
    mapUrl: await upload(data.tenant.map),
    theme: {
      ...theme,
      logo: {
        iconUrl: await upload(theme.logo?.icon),
        wordmarkUrl: await upload(theme.logo?.wordmark),
      },
      backgroundImage: theme.backgroundImage
        ? {
            url: defined(await upload(theme.backgroundImage.path)),
            opacity: theme.backgroundImage.opacity,
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
      imageUrl: await upload(image),
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

  if (drop) {
    const [deleted] = await db.delete(schema.tenants).where(eq(schema.tenants.domain, tenant.domain)).returning();

    if (deleted) {
      const files = await db.query.files.findMany({ where: { tenantId: deleted.id } });
      await Promise.all(files.map((file) => storage.delete(file.storageKey)));
    }
  } else if (await db.query.tenants.findFirst({ where: { domain: tenant.domain } })) {
    throw new Error(`Domain "${tenant.domain}" is already taken`);
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.tenants).values(tenant);

    if (files.length > 0) {
      await tx.insert(schema.files).values(files);
    }

    if (locations.length > 0) {
      await tx.insert(schema.locations).values(locations);
    }

    if (participants.length > 0) {
      await tx.insert(schema.participants).values(participants);
    }

    if (sessions.length > 0) {
      await tx.insert(schema.sessions).values(sessions);
    }

    if (sessionParticipants.length > 0) {
      await tx.insert(schema.sessionParticipants).values(sessionParticipants);
    }
  });

  for (const [key, content] of filesToUpload.entries()) {
    await storage.put(key, content);
  }

  async function upload(image: string | null | undefined) {
    if (!image) {
      return null;
    }

    const file = path.resolve(path.dirname(input), image);
    const extension = path.extname(file).toLowerCase();
    const contentType = contentTypes[extension];

    if (contentType === undefined) {
      throw new Error(`Unsupported image type: ${image}`);
    }

    const content = await fs.readFile(file);
    const id = createId();
    const storageKey = `${tenantId}/${id}${extension}`;

    filesToUpload.set(storageKey, content);

    files.push({
      id,
      tenantId,
      storageKey,
      name: path.basename(file),
      contentType,
      size: content.length,
    });

    return `/files/${id}`;
  }
}
