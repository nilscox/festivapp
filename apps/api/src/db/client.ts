import type { Logger as DrizzleLogger } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgAsyncDatabase, PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import * as schema from './schema.ts';

import type { Config } from '../config.ts';
import type { Logger } from '../logger.ts';

const { relations } = schema;

export type Database = PgAsyncDatabase<PgQueryResultHKT, Record<string, never>, typeof relations>;
export type Transaction = PgAsyncTransaction<PgQueryResultHKT, Record<string, never>, typeof relations>;

export type DatabaseHandle = {
  db: Database;
  close(): Promise<void>;
};

export function createDatabase(config: Config, logger: Logger): Promise<DatabaseHandle> {
  const drizzleLogger = toDrizzleLogger(logger);

  if (!config.databaseUrl) {
    return createMemoryDatabase(drizzleLogger);
  }

  return createPostgresDatabase(config.databaseUrl, drizzleLogger);
}

function toDrizzleLogger(logger: Logger): DrizzleLogger | false {
  if (logger.level !== 'debug') {
    return false;
  }

  return {
    logQuery: (query, params) => logger.debug(query, { params }),
  };
}

async function createPostgresDatabase(connection: string, logger: DrizzleLogger | false): Promise<DatabaseHandle> {
  const db: Database & { $client: { end: () => Promise<void> } } = drizzle({
    connection,
    logger,
    casing: 'snake_case',
    relations,
  });

  return {
    db,
    close: () => db.$client.end(),
  };
}

async function createMemoryDatabase(logger: DrizzleLogger | false): Promise<DatabaseHandle> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { pushSchema } = await import('drizzle-kit/api-postgres');

  const client = new PGlite();
  const db: Database = drizzle({ client, logger, casing: 'snake_case', relations });

  const { apply } = await pushSchema(schema, db, 'snake_case');
  await apply();

  return {
    db,
    close: () => client.close(),
  };
}
