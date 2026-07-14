import { getFestival } from '@/server-utils';

export const dynamic = 'force-dynamic';

// Dynamic web app manifest, built from the festival resolved via the subdomain.
export async function GET() {
  const festival = await getFestival();

  const manifest = {
    name: festival.name,
    short_name: festival.name,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: festival.accentColor ?? '#ffffff',
    theme_color: festival.primaryColor ?? '#000000',
    icons: [
      { src: '/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };

  return Response.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
