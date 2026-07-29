import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import z from 'zod';

import { db } from './db/client.ts';
import * as schema from './db/schema.ts';
import { storage } from './storage.ts';
import { themeSchema } from './theme.ts';

const contentTypes: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
};

const themeInputSchema = z.strictObject({
  ...themeSchema.shape,
  logo: z.strictObject({
    wordmarkUrl: z.string().nullable(),
    iconUrl: z.string().nullable(),
  }),
  backgroundImage: z
    .strictObject({
      url: z.string(),
      opacity: z.number().min(0).max(1),
    })
    .nullable(),
});

const dataSchema = z.strictObject({
  tenant: z.strictObject({
    name: z.string(),
    domain: z.string(),
    timezone: z.string(),
    theme: themeInputSchema,
  }),
  locations: z.array(z.string()).min(1),
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

export async function seed(input: string): Promise<void> {
  const data = dataSchema.parse(JSON.parse(await fs.readFile(input, 'utf8')));

  const tenantId = randomUUID();
  const fileValues: (typeof schema.files.$inferInsert)[] = [];

  async function upload<T extends string | null>(image: T): Promise<T> {
    if (!image) {
      return null as T;
    }

    const file = path.resolve(path.dirname(input), image);
    const extension = path.extname(file).toLowerCase();
    const contentType = contentTypes[extension];

    if (contentType === undefined) {
      throw new Error(`Unsupported image type: ${image}`);
    }

    const content = await fs.readFile(file);
    const id = randomUUID();
    const storageKey = `${tenantId}/${id}${extension}`;

    await storage.put(storageKey, content);

    fileValues.push({
      id,
      tenantId,
      storageKey,
      name: path.basename(file),
      contentType,
      size: content.length,
    });

    return `/files/${id}` as T;
  }

  const { theme } = data.tenant;

  const resolvedTheme = {
    ...theme,
    logo: {
      wordmarkUrl: await upload(theme.logo.wordmarkUrl),
      iconUrl: await upload(theme.logo.iconUrl),
    },
    backgroundImage: theme.backgroundImage
      ? { ...theme.backgroundImage, url: await upload(theme.backgroundImage.url) }
      : null,
  };

  const participantValues: (typeof schema.participants.$inferInsert)[] = [];

  for (const { image, ...participant } of data.participants) {
    participantValues.push({ tenantId, ...participant, imageUrl: await upload(image) });
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.tenants).values({ ...data.tenant, id: tenantId, theme: resolvedTheme });
    await tx.insert(schema.files).values(fileValues);

    const locationRows = await tx
      .insert(schema.locations)
      .values(data.locations.map((name, position) => ({ tenantId, name, position })))
      .returning();

    const locations = new Map(locationRows.map((row) => [row.name, row.id]));

    const participantRows = await tx.insert(schema.participants).values(participantValues).returning();

    const participants = new Map(participantRows.map((row) => [row.name, row.id]));

    const sessionRows = await tx
      .insert(schema.sessions)
      .values(
        data.sessions.map((session) => ({
          tenantId,
          locationId: locations.get(session.location)!,
          type: session.type,
          title: session.title,
          startsAt: new Date(session.start),
          endsAt: new Date(session.end),
          description: session.description,
        })),
      )
      .returning();

    const sessions = new Map(sessionRows.map((row, index) => [index, row.id]));

    await tx.insert(schema.sessionParticipants).values(
      data.sessions.flatMap((session, index) =>
        session.participants.map((participant, position) => ({
          sessionId: sessions.get(index)!,
          participantId: participants.get(participant)!,
          position,
        })),
      ),
    );
  });
}
