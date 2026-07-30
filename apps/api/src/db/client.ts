import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgAsyncDatabase, PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { Pool } from 'pg';

import { config } from '../config.ts';
import { relations } from './schema.ts';

export type Database = PgAsyncDatabase<PgQueryResultHKT, Record<string, never>, typeof relations>;
export type Transaction = PgAsyncTransaction<PgQueryResultHKT, Record<string, never>, typeof relations>;

export const db: Database & { $client: Pool } = drizzle({
  connection: config.databaseUrl,
  logger: false,
  casing: 'snake_case',
  relations,
});
