import { PGlite } from '@electric-sql/pglite';
import type { DrizzleConfig, Logger as DrizzleLogger } from 'drizzle-orm';
import { drizzle as drizzleNodePostgres } from 'drizzle-orm/node-postgres';
import type { PgAsyncDatabase, PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePgLite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';

import * as schema from './schema.ts';

import type { Config } from '../config.ts';
import type { Logger } from '../logger.ts';

export type Database = PgAsyncDatabase<TQueryResult, TFullSchema, TRelations> & { $client: DatabaseClient };
export type Transaction = PgAsyncTransaction<TQueryResult, TFullSchema, TRelations>;
export type DatabaseClient = Pool | PGlite;

type TQueryResult = PgQueryResultHKT;
type TFullSchema = Record<string, never>;
type TRelations = typeof schema.relations;

export function createDatabase({ config, logger }: { config: Config; logger: Logger }): Database {
  const client = createDatabaseClient(config.databaseUrl);

  const options: DrizzleConfig<TFullSchema, TRelations> = {
    logger: toDrizzleLogger(logger),
    casing: 'snake_case',
    relations: schema.relations,
  };

  if (client instanceof PGlite) {
    return drizzlePgLite({ client, ...options });
  }

  return drizzleNodePostgres({ client, ...options });
}

function createDatabaseClient(databaseUrl: string | undefined): DatabaseClient {
  if (!databaseUrl) {
    return new PGlite();
  }

  return new Pool({ connectionString: databaseUrl });
}

export function closeDatabase(db: Database): Promise<void> {
  if (db.$client instanceof Pool) {
    return db.$client.end();
  }

  return db.$client.close();
}

export async function applyMigrations(db: Database): Promise<void> {
  const { pushSchema } = await import('drizzle-kit/api-postgres');
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
