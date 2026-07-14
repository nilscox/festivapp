import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

// Serve the service worker with the current build id injected as its cache
// version, so `activate` purges the previous build's caches on every deploy.
const swPath = join(process.cwd(), 'src', 'sw.js');
const buildIdPath = join(process.cwd(), '.next', 'BUILD_ID');

async function getVersion() {
  try {
    return (await readFile(buildIdPath, 'utf8')).trim();
  } catch {
    return 'dev';
  }
}

export async function GET() {
  const [template, version] = await Promise.all([readFile(swPath, 'utf8'), getVersion()]);

  return new Response(template.replaceAll('__SW_VERSION__', version), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    },
  });
}
