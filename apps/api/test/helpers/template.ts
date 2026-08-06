import { PGlite } from '@electric-sql/pglite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { applyMigrations, createDatabase } from '../../src/db/client.ts';
import { testConfig } from './config.ts';
import { StubLogger } from './logger.ts';

const schemaFile = new URL('../../src/db/schema.ts', import.meta.url);
const cacheDir = new URL('../../node_modules/.cache/test-db/', import.meta.url).pathname;
const templatePrefix = 'festivapp_test_tpl_';

/**
 * A migrated database is built once per run, from global setup so that the files cannot race to
 * build it, and each of them starts from a copy: replaying the dump costs ~0.3s against ~2.6s of
 * drizzle-kit. The name carries a hash of the schema, so an edit invalidates the cache.
 */
export async function createTemplate(): Promise<void> {
  const path = templatePath();

  await mkdir(cacheDir, { recursive: true });

  const cached = await readdir(cacheDir);

  if (cached.includes(basename(path))) {
    return;
  }

  for (const stale of cached.filter((entry) => entry.startsWith(templatePrefix))) {
    await rm(`${cacheDir}${stale}`, { force: true });
  }

  const client = new PGlite();

  try {
    await applyMigrations(createDatabase({ config: testConfig(), logger: new StubLogger('info'), client }));

    const dump = await client.dumpDataDir('none');

    await writeFile(path, Buffer.from(await dump.arrayBuffer()));
  } finally {
    await client.close();
  }
}

export function createFileClient(): PGlite {
  return new PGlite({ loadDataDir: new Blob([readFileSync(templatePath())]) });
}

function templatePath(): string {
  const hash = createHash('sha256').update(readFileSync(schemaFile)).digest('hex').slice(0, 12);

  return `${cacheDir}${templatePrefix}${hash}.tar`;
}
