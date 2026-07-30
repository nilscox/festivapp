import { z } from 'zod';

import { falsyToNull } from './utils.ts';

const color = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, 'must be a hex color such as #1d4ed8');

const fontStack = z.string().trim().min(1).max(200);

const url = z.string().trim().startsWith('/');

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
    name: z.string().trim().max(60).transform(falsyToNull).nullable(),
    shortName: z.string().trim().max(12).transform(falsyToNull).nullable(),
  }),
  customCss: z.string().trim().max(20_000).transform(falsyToNull).nullable(),
});
