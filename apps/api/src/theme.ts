import { z } from 'zod';

const color = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, 'must be a hex color such as #1d4ed8');

const fontStack = z.string().trim().min(1).max(200);

const url = z.union([z.url(), z.string().regex(/^\/[^\s]*$/, 'must be a URL or an absolute path')]);

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null)
    .nullable();

export const themeSchema = z.strictObject({
  backgroundColor: color,
  accentColor: color,
  fonts: z.strictObject({
    display: fontStack,
    body: fontStack,
    mono: fontStack,
  }),
  logo: z.strictObject({
    wordmarkUrl: url.nullable(),
    iconUrl: url.nullable(),
  }),
  backgroundImage: z
    .strictObject({
      url,
      opacity: z.number().min(0).max(1),
    })
    .nullable(),
  pwa: z.strictObject({
    name: nullableText(60),
    shortName: nullableText(12),
  }),
  customCss: nullableText(20_000),
});
