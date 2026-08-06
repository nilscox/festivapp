import { PGlite } from '@electric-sql/pglite';
import { assert } from '@festivapp/utils';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { Pool } from 'pg';

import { applyMigrations, closeDatabase, createDatabase, type DatabaseClient } from '../../src/db/client.ts';
import { testConfig } from './config.ts';
import { StubLogger } from './logger.ts';

const schemaFile = new URL('../../src/db/schema.ts', import.meta.url);
const cacheDir = new URL('../../node_modules/.cache/test-db/', import.meta.url).pathname;

const templatePrefix = 'festivapp_test_tpl_';
const databasePrefix = 'festivapp_test_db_';

/**
 * A migrated database is built once per run and every test file starts from a copy of it: a pglite
 * tarball replayed through `loadDataDir`, or a Postgres `create database … template …`. Migrating
 * per file costs ~2.6s of drizzle-kit; copying costs ~0.3s.
 */
export async function createTemplate(): Promise<string> {
  const name = `${templatePrefix}${await schemaHash()}`;
  const url = testDatabaseUrl();

  if (url) {
    await createPostgresTemplate(url, name);
  } else {
    await createPgliteTemplate(name);
  }

  return name;
}

export async function dropTemplate(name: string): Promise<void> {
  const url = testDatabaseUrl();

  if (url) {
    await withMaintenance(url, (pool) => dropDatabases(pool, [databasePrefix, name]));
  }
}

/**
 * One database per test file, named after it, so a failing run leaves something inspectable. The
 * client is built synchronously — `api.db` has to exist before the hooks run — and both backends
 * connect lazily, so `prepareFileDatabase` only has to win the race against the first query.
 */
export function createFileClient(): DatabaseClient {
  const url = testDatabaseUrl();

  if (!url) {
    return new PGlite({ loadDataDir: new Blob([readFileSync(templatePath(templateName()))]) });
  }

  return new Pool({ connectionString: databaseUrl(url, fileDatabaseName()) });
}

export async function prepareFileDatabase(): Promise<void> {
  const url = testDatabaseUrl();

  if (!url) {
    return;
  }

  const name = fileDatabaseName();

  await withMaintenance(url, async (pool) => {
    await dropDatabases(pool, [name]);
    await pool.query(`create database "${name}" template "${templateName()}"`);
  });
}

export async function dropFileDatabase(): Promise<void> {
  const url = testDatabaseUrl();

  if (url) {
    await withMaintenance(url, (pool) => dropDatabases(pool, [fileDatabaseName()]));
  }
}

export function testDatabaseUrl(): string | undefined {
  return process.env.TEST_DATABASE_URL;
}

function templateName(): string {
  const name = process.env.FESTIVAPP_TEST_TEMPLATE;

  assert(name, new Error('Missing test database template — run the tests through "pnpm test"'));

  return name;
}

async function createPgliteTemplate(name: string): Promise<void> {
  const path = templatePath(name);

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
    await applyMigrations(migrationsDatabase(client));

    const dump = await client.dumpDataDir('none');

    await writeFile(path, Buffer.from(await dump.arrayBuffer()));
  } finally {
    await client.close();
  }
}

async function createPostgresTemplate(url: string, name: string): Promise<void> {
  await withMaintenance(url, async (pool) => {
    await dropDatabases(pool, [databasePrefix, templatePrefix]);
    await pool.query(`create database "${name}"`);
  });

  const client = new Pool({ connectionString: databaseUrl(url, name) });
  const db = migrationsDatabase(client);

  try {
    await applyMigrations(db);
  } finally {
    await closeDatabase(db);
  }
}

function migrationsDatabase(client: DatabaseClient) {
  return createDatabase({ config: testConfig(), logger: new StubLogger('info'), client });
}

async function withMaintenance<T>(url: string, run: (pool: Pool) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: databaseUrl(url, 'postgres') });

  try {
    return await run(pool);
  } finally {
    await pool.end();
  }
}

/** `starts_with` rather than `like`, whose `_` wildcard would reach past the test prefixes. */
async function dropDatabases(pool: Pool, prefixes: string[]): Promise<void> {
  const { rows } = await pool.query<{ datname: string }>(
    'select datname from pg_database where exists (select 1 from unnest($1::text[]) prefix where starts_with(datname, prefix))',
    [prefixes],
  );

  for (const { datname } of rows) {
    await pool.query(`drop database if exists "${datname}" with (force)`);
  }
}

function databaseUrl(url: string, name: string): string {
  const parsed = new URL(url);

  parsed.pathname = `/${name}`;

  return parsed.toString();
}

function templatePath(name: string): string {
  return `${cacheDir}${name}.tar`;
}

async function schemaHash(): Promise<string> {
  const source = await readFile(schemaFile, 'utf8');

  return createHash('sha256').update(source).digest('hex').slice(0, 12);
}

function fileDatabaseName(): string {
  const file = basename(process.argv[1] ?? 'unknown');
  const slug = file
    .replace(/\.test\.tsx?$/, '')
    .replaceAll(/[^a-z0-9]+/gi, '_')
    .toLowerCase();

  return `${databasePrefix}${slug}`;
}
