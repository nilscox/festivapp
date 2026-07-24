import { defineConfig } from 'drizzle-kit';
import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: databaseUrl,
  },
});
