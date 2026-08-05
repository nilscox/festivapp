import { PGlite } from '@electric-sql/pglite';
import { pushSchema } from 'drizzle-kit/api-postgres';
import type { Logger as DrizzleLogger } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgAsyncDatabase, PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePgLite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';

import * as schema from './schema.ts';

import type { Config } from '../config.ts';
import type { Logger } from '../logger.ts';

const { relations } = schema;

export type Database = PgAsyncDatabase<PgQueryResultHKT, Record<string, never>, typeof relations>;
export type Transaction = PgAsyncTransaction<PgQueryResultHKT, Record<string, never>, typeof relations>;
export type DatabaseClient = Pool | PGlite;

export function createDatabaseClient({ config }: { config: Config }): DatabaseClient {
  if (!config.databaseUrl) {
    return new PGlite();
  }

  return new Pool({ connectionString: config.databaseUrl });
}

export function closeDatabaseClient(client: DatabaseClient): Promise<void> {
  if (client instanceof Pool) {
    return client.end();
  }

  return client.close();
}

export function createDatabase({ client, logger }: { client: DatabaseClient; logger: Logger }): Database {
  const options = {
    logger: toDrizzleLogger(logger),
    casing: 'snake_case',
    relations,
  } as const;

  if (client instanceof PGlite) {
    return drizzlePgLite({ client, ...options });
  }

  return drizzle({ client, ...options });
}

export async function applyMigrations(db: Database): Promise<void> {
  const { apply } = await pushSchema(schema, db, 'snake_case');

  await apply();
}

function toDrizzleLogger(logger: Logger): DrizzleLogger | false {
  if (logger.level !== 'debug') {
    return false;
  }

  return {
    logQuery: (query, params) => logger.debug(query, { params }),
  };
}
