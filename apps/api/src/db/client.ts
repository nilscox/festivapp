import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgAsyncTransaction, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { config } from '../config.ts';
import { relations } from './schema.ts';

export type Transaction = PgAsyncTransaction<PgQueryResultHKT, Record<string, never>, typeof relations>;

export const db = drizzle({
  connection: config.databaseUrl,
  logger: false,
  casing: 'snake_case',
  relations,
});
