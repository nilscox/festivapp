'use server';

import { eq } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { fromEntries, pick } from 'remeda';
import { db } from 'src/database/db';
import { schema } from 'src/database/schema';
import { handleServerActionError } from 'src/server-utils';
import { ActionResult } from 'src/utils';
import z from 'zod';

export async function updateArtist(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const parsed = z
      .object({
        artistId: z.string(),
        name: z.string().trim(),
        image: z.string().trim(),
        styles: z.string().array(),
        origin: z.string().trim(),
        label: z.string().trim(),
        description: z.string().trim(),
        social: z.string().array(),
      })
      .parse({
        ...fromEntries(Array.from(formData.entries())),
        styles: formData.getAll('styles'),
        social: formData.getAll('social'),
      });

    const update: Partial<typeof schema.artists.$inferInsert> = pick(parsed, [
      'name',
      'image',
      'styles',
      'origin',
      'label',
      'description',
      'social',
    ]);

    await db.update(schema.artists).set(update).where(eq(schema.artists.id, parsed.artistId));

    refresh();

    return { success: true, data: {} };
  } catch (error) {
    return handleServerActionError(error);
  }
}
