import { drizzle } from 'drizzle-orm/node-postgres';

import { config } from '../config.ts';
import { relations } from './schema.ts';

export const db = drizzle({
  connection: config.databaseUrl,
  logger: false,
  casing: 'snake_case',
  relations,
});
