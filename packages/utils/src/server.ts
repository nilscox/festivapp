import { customAlphabet } from 'nanoid';
import fs from 'node:fs/promises';
import z from 'zod';

import { ActionResult } from './client';
import { assert } from './index';

export const createId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export function handleServerActionError<Data>(error: unknown, data: Data): ActionResult<Data> {
  if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
    throw error;
  }

  if (error instanceof z.ZodError) {
    const fields: Record<string, string> = {};

    for (const issue of error.issues) {
      fields[issue.path.join('.')] = issue.message;
    }

    return {
      success: false,
      data,
      fields,
    };
  }

  console.error(error);

  if (!(error instanceof Error)) {
    return {
      success: false,
      data,
      error: 'Unknown error',
    };
  }

  return {
    success: false,
    data,
    error: error.message,
  };
}

const imageExtensions: Record<string, string> = {
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  bmp: 'bmp',
  gif: 'gif',
  svg: 'svg',
  webp: 'webp',
};

export async function saveUploadedImage(file: File): Promise<string> {
  const extension = imageExtensions[file.type.replace(/^image\//, '')];

  assert(extension, new Error(`Invalid image format: ${file.type}`));

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageId = `${createId()}.${extension}`;

  await fs.writeFile(`${process.env.UPLOAD_DIR}/${imageId}`, buffer);

  return imageId;
}

export function isUniqueViolation(error: unknown, column: string): boolean {
  return z
    .object({
      code: z.literal('23505'),
      details: z.string().includes(column),
    })
    .safeParse(error).success;
}
