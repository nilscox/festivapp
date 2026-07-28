import type { TenantTheme } from '@festivapp/contracts';
import { z } from 'zod';

export const defaultTheme: TenantTheme = {
  backgroundColor: '#ffffff',
  accentColor: '#18181b',
  fonts: {
    display: "'Space Grotesk Variable', system-ui, sans-serif",
    body: "'Space Grotesk Variable', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  logo: {
    wordmarkUrl: null,
    iconUrl: null,
  },
  backgroundImage: null,
  pwa: {
    name: null,
    shortName: null,
  },
  customCss: null,
};

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

export const themeSchema = z.object({
  backgroundColor: color,
  accentColor: color,
  fonts: z.object({
    display: fontStack,
    body: fontStack,
    mono: fontStack,
  }),
  logo: z.object({
    wordmarkUrl: url.nullable(),
    iconUrl: url.nullable(),
  }),
  backgroundImage: z
    .object({
      url,
      opacity: z.number().min(0).max(1),
    })
    .nullable(),
  pwa: z.object({
    name: nullableText(60),
    shortName: nullableText(12),
  }),
  customCss: nullableText(20_000),
});
