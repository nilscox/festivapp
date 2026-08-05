import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgAsyncDatabase, PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import * as schema from './schema.ts';

import type { Config } from '../config.ts';

const { relations } = schema;

export type Database = PgAsyncDatabase<PgQueryResultHKT, Record<string, never>, typeof relations>;
export type Transaction = PgAsyncTransaction<PgQueryResultHKT, Record<string, never>, typeof relations>;

export type DatabaseHandle = {
  db: Database;
  close(): Promise<void>;
};

export function createDatabase(config: Config): Promise<DatabaseHandle> {
  if (!config.databaseUrl) {
    return createMemoryDatabase();
  }

  return createPostgresDatabase(config.databaseUrl);
}

async function createPostgresDatabase(connection: string): Promise<DatabaseHandle> {
  const db: Database & { $client: { end: () => Promise<void> } } = drizzle({
    connection,
    logger: false,
    casing: 'snake_case',
    relations,
  });

  return {
    db,
    close: () => db.$client.end(),
  };
}

async function createMemoryDatabase(): Promise<DatabaseHandle> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { pushSchema } = await import('drizzle-kit/api-postgres');

  const client = new PGlite();
  const db: Database = drizzle({ client, casing: 'snake_case', relations });

  const { apply } = await pushSchema(schema, db, 'snake_case');
  await apply();

  return {
    db,
    close: () => client.close(),
  };
}
