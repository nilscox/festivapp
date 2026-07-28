import type { TenantConfig } from '@festivapp/contracts';

import { colorMix, isLight } from './lib/colors';

const inkOnLight = '#18181b';
const inkOnDark = '#fafafa';

export function applyTenant(tenant: TenantConfig): void {
  const { backgroundColor, accentColor, fonts, logo, backgroundImage } = tenant.theme;
  const ink = isLight(backgroundColor) ? inkOnLight : inkOnDark;

  const variables: Record<string, string> = {
    '--color-app': backgroundColor,
    '--color-bg': colorMix('#000000', 6, backgroundColor),
    '--color-surface': colorMix(ink, 4, backgroundColor),
    '--color-chip': colorMix(ink, 8, backgroundColor),
    '--color-line': colorMix(ink, 14, backgroundColor),
    '--color-faint': colorMix(ink, 42, backgroundColor),
    '--color-muted': colorMix(ink, 62, backgroundColor),
    '--color-ink': ink,
    '--color-accent': accentColor,
    '--font-display': fonts.display,
    '--font-body': fonts.body,
    '--font-mono': fonts.mono,
    '--background-image': backgroundImage ? `url("${backgroundImage.url}")` : 'none',
    '--background-scrim': backgroundImage
      ? colorMix(backgroundColor, (1 - backgroundImage.opacity) * 100, 'transparent')
      : backgroundColor,
  };

  for (const [name, value] of Object.entries(variables)) {
    document.documentElement.style.setProperty(name, value);
  }

  localStorage.setItem('theme', JSON.stringify(variables));

  setCustomCss(tenant.theme.customCss ?? '');
  localStorage.setItem('theme-css', tenant.theme.customCss ?? '');

  document.title = tenant.name;
  setMeta('theme-color', backgroundColor);

  if (logo.iconUrl !== null) {
    setIcon(logo.iconUrl);
  }
}

/** Assigning textContent keeps the tenant's CSS out of the HTML parser, so it can't close the tag. */
function setCustomCss(css: string): void {
  const style = document.getElementById('tenant-css') ?? document.createElement('style');

  style.id = 'tenant-css';
  style.textContent = css;

  document.head.append(style);
}

function setMeta(name: string, content: string): void {
  const meta = document.querySelector(`meta[name="${name}"]`);

  if (meta !== null) {
    meta.setAttribute('content', content);
  }
}

function setIcon(href: string): void {
  const icon = document.querySelector('link[rel="icon"]');

  if (icon !== null) {
    icon.setAttribute('href', href);
    icon.removeAttribute('type');
  }
}
