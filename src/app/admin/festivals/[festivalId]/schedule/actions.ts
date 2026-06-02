'use server';

import { and, eq } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { db } from 'src/database/db';
import { schema } from 'src/database/schema';
import { handleServerActionError, saveUploadedImage } from 'src/server-utils';
import { ActionResult, createId } from 'src/utils';
import { z } from 'zod';

const eventInputSchema = z
  .object({
    festivalId: z.string(),
    locationId: z.string(),
    type: z.enum(['live', 'dj_set', 'talk', 'workshop']).optional(),
    start: z.coerce.date({ error: 'Invalid start date' }),
    end: z.coerce.date({ error: 'Invalid end date' }),
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    image: z.instanceof(File).optional(),
    artistIds: z.string().array(),
  })
  .refine((data) => data.end >= data.start, {
    message: 'End date must be after start date',
    path: ['end'],
  });

export async function createEvent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const parsed = eventInputSchema.parse({
      festivalId: formData.get('festivalId'),
      locationId: formData.get('locationId'),
      type: formData.get('type') || undefined,
      start: formData.get('start'),
      end: formData.get('end'),
      title: formData.get('title') || undefined,
      description: formData.get('description') || undefined,
      image: formData.get('image') instanceof File && (formData.get('image') as File).size > 0 ? formData.get('image') : undefined,
      artistIds: formData.getAll('artistIds'),
    });

    let imageRef: string | null = null;

    if (parsed.image) {
      imageRef = await saveUploadedImage(parsed.image);
    }

    const eventId = createId();

    await db.insert(schema.events).values({
      id: eventId,
      festivalId: parsed.festivalId,
      locationId: parsed.locationId,
      type: parsed.type,
      start: parsed.start,
      end: parsed.end,
      title: parsed.title || null,
      description: parsed.description || null,
      image: imageRef,
    });

    // Insert artist associations
    for (const artistId of parsed.artistIds) {
      await db.insert(schema.eventsArtists).values({
        eventId,
        artistId,
      });
    }

    refresh();

    return { success: true, data: { id: eventId } };
  } catch (error) {
    return handleServerActionError(error, {});
  }
}

export async function updateEvent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const parsed = eventInputSchema.extend({
      eventId: z.string(),
    }).parse({
      eventId: formData.get('eventId'),
      festivalId: formData.get('festivalId'),
      locationId: formData.get('locationId'),
      type: formData.get('type') || undefined,
      start: formData.get('start'),
      end: formData.get('end'),
      title: formData.get('title') || undefined,
      description: formData.get('description') || undefined,
      image: formData.get('image') instanceof File && (formData.get('image') as File).size > 0 ? formData.get('image') : undefined,
      artistIds: formData.getAll('artistIds'),
    });

    let imageRef: string | null | undefined;

    if (parsed.image) {
      imageRef = await saveUploadedImage(parsed.image);
    }

    const update: Partial<typeof schema.events.$inferInsert> = {
      type: parsed.type,
      start: parsed.start,
      end: parsed.end,
      title: parsed.title || null,
      description: parsed.description || null,
    };

    if (imageRef !== undefined) {
      update.image = imageRef;
    }

    await db.update(schema.events).set(update).where(eq(schema.events.id, parsed.eventId));

    // Reconcile artist associations: delete all, then re-insert
    await db.delete(schema.eventsArtists).where(eq(schema.eventsArtists.eventId, parsed.eventId));

    for (const artistId of parsed.artistIds) {
      await db.insert(schema.eventsArtists).values({
        eventId: parsed.eventId,
        artistId,
      });
    }

    refresh();

    return { success: true, data: { id: parsed.eventId } };
  } catch (error) {
    return handleServerActionError(error, {});
  }
}

export async function deleteEvent(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const eventId = z.string().parse(formData.get('eventId'));

    await db.delete(schema.eventsArtists).where(eq(schema.eventsArtists.eventId, eventId));
    await db.delete(schema.events).where(eq(schema.events.id, eventId));

    refresh();

    return { success: true, data: { id: eventId } };
  } catch (error) {
    return handleServerActionError(error, {});
  }
}
