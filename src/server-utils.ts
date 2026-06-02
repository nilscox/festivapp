import fs from 'node:fs/promises';
import { assert, createId } from 'src/utils';

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
