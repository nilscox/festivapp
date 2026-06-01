import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { defined } from 'src/utils';

import { relations } from './schema';

export const db = drizzle({
  relations,
  client: new Pool({ connectionString: defined(process.env.DATABASE_URL, new Error('Missing DATABASE_URL')) }),
  logger: process.env.DATABASE_DEBUG === 'true',
});
