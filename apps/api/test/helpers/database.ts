import { getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

import * as schema from '../../src/db/schema.ts';
import { testContainer } from './container.ts';

const tables = Object.values(schema).filter((value) => is(value, PgTable));

export async function resetDatabase(): Promise<void> {
  const { db } = testContainer();
  const names = tables.map((table) => sql.identifier(getTableName(table)));

  await db.execute(sql`truncate table ${sql.join(names, sql`, `)} cascade`);
}

export async function closeDatabase(): Promise<void> {
  await testContainer().close();
}
