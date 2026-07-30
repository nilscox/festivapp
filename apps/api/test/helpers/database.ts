import { getTableName, sql } from 'drizzle-orm';

import { closeDatabase, db } from '../../src/db/client.ts';
import * as schema from '../../src/db/schema.ts';

export { closeDatabase };

const tables = [
  schema.tenants,
  schema.files,
  schema.locations,
  schema.participants,
  schema.sessions,
  schema.sessionParticipants,
  schema.organizers,
  schema.organizerTenants,
  schema.authSessions,
];

export async function resetDatabase(): Promise<void> {
  const names = tables.map((table) => sql.identifier(getTableName(table)));

  await db.execute(sql`truncate table ${sql.join(names, sql`, `)} cascade`);
}
