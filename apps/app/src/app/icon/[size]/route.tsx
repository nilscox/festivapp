import { ImageResponse } from 'next/og';

import { getFestival } from '@/server-utils';

export const dynamic = 'force-dynamic';

const sizes = new Set([192, 512]);

// Generated fallback icon: the festival's initial over its primary color.
// (Admin-uploaded icons are not wired up yet.)
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);

  if (!sizes.has(size)) {
    return new Response('Not found', { status: 404 });
  }

  const festival = await getFestival();
  const initial = festival.name.trim().charAt(0).toUpperCase() || '?';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: festival.primaryColor ?? '#000000',
          color: festival.accentColor ?? '#ffffff',
          fontSize: size * 0.5,
          fontWeight: 700,
        }}
      >
        {initial}
      </div>
    ),
    { width: size, height: size },
  );
}
