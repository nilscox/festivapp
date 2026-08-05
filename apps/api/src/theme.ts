import { z } from 'zod';

import { optionalString } from './utils.ts';

const color = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, 'must be a hex color (#RRGGBB)');

export const themeSchema = z.strictObject({
  backgroundColor: color,
  accentColor: color,
  fonts: z.strictObject({
    display: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(200),
    mono: z.string().trim().min(1).max(200),
  }),
  logo: z.strictObject({
    wordmarkUrl: optionalString().pipe(z.string().startsWith('/').nullable()),
    iconUrl: optionalString().pipe(z.string().startsWith('/').nullable()),
  }),
  backgroundImage: z
    .strictObject({
      url: z.string().trim().startsWith('/'),
      opacity: z.number().min(0).max(1),
    })
    .nullable(),
  pwa: z.strictObject({
    name: optionalString().pipe(z.string().max(60).nullable()),
    shortName: optionalString().pipe(z.string().max(12).nullable()),
  }),
  customCss: optionalString().pipe(z.string().max(20_000).nullable()),
});
