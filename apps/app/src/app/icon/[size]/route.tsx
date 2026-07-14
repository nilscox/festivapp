import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ImageResponse } from 'next/og';

import { getFestival } from '@/server-utils';

export const dynamic = 'force-dynamic';

const sizes = new Set([192, 512]);

const mimeTypes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
};

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);

  if (!sizes.has(size)) {
    return new Response('Not found', { status: 404 });
  }

  const festival = await getFestival();
  const uploaded = festival.icon ? await readUploadedIcon(festival.icon) : undefined;

  return new ImageResponse(uploaded ? <UploadedIcon src={uploaded} /> : <FallbackIcon festival={festival} size={size} />, {
    width: size,
    height: size,
  });
}

// Read the admin-uploaded icon as a data URI. Returns undefined (→ generated
// fallback) if the file is missing.
async function readUploadedIcon(icon: string) {
  try {
    const uploadDir = process.env.UPLOAD_DIR ?? 'public/uploads';
    const bytes = await readFile(join(uploadDir, icon));
    const mime = mimeTypes[icon.split('.').at(-1)?.toLowerCase() ?? ''] ?? 'image/png';

    return `data:${mime};base64,${bytes.toString('base64')}`;
  } catch {
    return undefined;
  }
}

function UploadedIcon({ src }: { src: string }) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

// Generated fallback icon: the festival's initial over its primary color.
function FallbackIcon({ festival, size }: { festival: { name: string; primaryColor: string | null; accentColor: string | null }; size: number }) {
  const initial = festival.name.trim().charAt(0).toUpperCase() || '?';

  return (
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
  );
}
