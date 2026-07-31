import { getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

import { closeDatabase, db } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';

export { closeDatabase };

const tables = Object.values(schema).filter((value) => is(value, PgTable));

export async function resetDatabase(): Promise<void> {
  const names = tables.map((table) => sql.identifier(getTableName(table)));

  await db.execute(sql`truncate table ${sql.join(names, sql`, `)} cascade`);
}
