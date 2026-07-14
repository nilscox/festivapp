'use server';

import { db, schema } from '@festivapp/persistence';
import { ActionResult } from '@festivapp/utils/client';
import { createId, handleServerActionError, isUniqueViolation, saveUploadedImage } from '@festivapp/utils/server';
import { eq } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { fromEntries, pick } from 'remeda';
import { z } from 'zod';

import { getAuthUser } from '@/server-utils';

export async function createFestival(
  _prev: ActionResult<FormData>,
  formData: FormData,
): Promise<ActionResult<FormData>> {
  const admin = await getAuthUser();

  try {
    const festivalId = createId();

    const parsed = z
      .object({
        name: z.string().trim().min(1, { error: 'Name is required' }),
        start: z.coerce.date({ error: 'Invalid start date' }),
        end: z.coerce.date({ error: 'Invalid end date' }),
      })
      .parse(fromEntries(Array.from(formData.entries())));

    await db.insert(schema.festivals).values({
      id: festivalId,
      ...parsed,
    });

    await db.insert(schema.adminsFestivals).values({
      festivalId,
      adminId: admin.id,
    });

    redirect(`/festivals/${festivalId}`);
  } catch (error) {
    if (isUniqueViolation(error, 'name')) {
      return { success: false, fields: { name: 'This name is already taken' } };
    }

    return handleServerActionError(error, formData);
  }
}

export async function updateFestival(
  _prev: ActionResult<FormData>,
  formData: FormData,
): Promise<ActionResult<FormData>> {
  await getAuthUser();

  try {
    const parsed = z
      .object({
        festivalId: z.string(),
        name: z.string().trim().optional(),
        domain: z.string().trim().optional(),
        start: z.coerce.date({ error: 'Invalid start date' }).optional(),
        end: z.coerce.date({ error: 'Invalid end date' }).optional(),
        map: z.instanceof(File).optional(),
        icon: z.instanceof(File).optional(),
        backgroundImage: z.instanceof(File).optional(),
        primaryColor: z.string().nullable().optional(),
        accentColor: z.string().nullable().optional(),
        globalStyles: z.string().nullable().optional(),
        beforeStartInfo: z.string().nullable().optional(),
        afterEndInfo: z.string().nullable().optional(),
      })
      .parse(fromEntries(Array.from(formData.entries())));

    const update: Partial<typeof schema.festivals.$inferInsert> = pick(parsed, [
      'name',
      'domain',
      'start',
      'end',
      'primaryColor',
      'accentColor',
      'globalStyles',
      'beforeStartInfo',
      'afterEndInfo',
    ]);

    if (parsed.map && parsed.map.size > 0) {
      update.map = await saveUploadedImage(parsed.map);
    }

    if (parsed.icon && parsed.icon.size > 0) {
      update.icon = await saveUploadedImage(parsed.icon);
    }

    if (parsed.backgroundImage && parsed.backgroundImage.size > 0) {
      update.backgroundImage = await saveUploadedImage(parsed.backgroundImage);
    }

    await db.update(schema.festivals).set(update).where(eq(schema.festivals.id, parsed.festivalId));

    refresh();

    return { success: true, data: formData };
  } catch (error) {
    if (isUniqueViolation(error, 'name')) {
      return { success: false, fields: { name: 'This name is already taken' } };
    }

    if (isUniqueViolation(error, 'domain')) {
      return { success: false, fields: { domain: 'This domain is already taken' } };
    }

    return handleServerActionError(error, formData);
  }
}
