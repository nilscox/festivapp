'use server';

import { isAfter } from 'date-fns';
import { eq } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { fromEntries } from 'remeda';
import { db } from 'src/database/db';
import { schema } from 'src/database/schema';
import { handleServerActionError, saveUploadedImage } from 'src/server-utils';
import { ActionResult, createId } from 'src/utils';
import z from 'zod';

const eventSchema = z
  .object({
    type: z.enum(['live', 'dj_set', 'talk', 'workshop']),
    start: z.coerce.date(),
    end: z.coerce.date(),
    title: z.string(),
    description: z.string(),
    image: z.instanceof(File),
    artistId: z.string().array(),
  })
  .refine((data) => isAfter(data.end, data.start), {
    message: 'End date must be after start date',
    path: ['end'],
  });

export async function createEvent(prev: ActionResult<FormData>, formData: FormData): Promise<ActionResult<FormData>> {
  try {
    const parsed = eventSchema
      .extend({
        festivalId: z.string().min(1),
        locationId: z.string().min(1),
      })
      .parse({
        ...fromEntries(Array.from(formData.entries())),
        artistId: formData.getAll('artistId'),
      });

    const eventId = createId();

    const values: typeof schema.events.$inferInsert = {
      id: eventId,
      festivalId: parsed.festivalId,
      locationId: parsed.locationId,
      type: parsed.type,
      start: parsed.start,
      end: parsed.end,
      title: parsed.title || null,
      description: parsed.description || null,
      image: null,
    };

    if (parsed.image && parsed.image.size > 0) {
      values.image = await saveUploadedImage(parsed.image);
    }

    await db.insert(schema.events).values(values);

    if (parsed.artistId && parsed.artistId.length > 0) {
      await db.insert(schema.eventsArtists).values(
        parsed.artistId.map((artistId) => ({
          eventId,
          artistId,
        })),
      );
    }

    refresh();

    return { success: true, data: formData };
  } catch (error) {
    return handleServerActionError(error, formData);
  }
}

export async function updateEvent(prev: ActionResult<FormData>, formData: FormData): Promise<ActionResult<FormData>> {
  const parsed = eventSchema.extend({ eventId: z.string().min(1) }).parse({
    ...fromEntries(Array.from(formData.entries())),
    artistId: formData.getAll('artistId'),
  });

  const eventId = parsed.eventId;

  const values: Partial<typeof schema.events.$inferInsert> = {
    type: parsed.type,
    start: parsed.start,
    end: parsed.end,
    title: parsed.title || null,
    description: parsed.description || null,
    image: null,
  };

  if (parsed.image && parsed.image.size > 0) {
    values.image = await saveUploadedImage(parsed.image);
  }

  await db.update(schema.events).set(values).where(eq(schema.events.id, parsed.eventId));

  await db.delete(schema.eventsArtists).where(eq(schema.eventsArtists.eventId, eventId));

  if (parsed.artistId && parsed.artistId.length > 0) {
    await db.insert(schema.eventsArtists).values(
      parsed.artistId.map((artistId) => ({
        eventId,
        artistId,
      })),
    );
  }

  refresh();

  return { success: true, data: formData };
}

export async function deleteEvent(prev: ActionResult<FormData>, formData: FormData): Promise<ActionResult<FormData>> {
  try {
    const eventId = z.string().parse(formData.get('eventId'));

    await db.delete(schema.eventsArtists).where(eq(schema.eventsArtists.eventId, eventId));
    await db.delete(schema.events).where(eq(schema.events.id, eventId));

    refresh();

    return { success: true, data: formData };
  } catch (error) {
    return handleServerActionError(error, formData);
  }
}
