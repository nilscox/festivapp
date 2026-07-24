function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config = {
  host: requireEnv('HOST'),
  port: Number(requireEnv('PORT')),
  databaseUrl: requireEnv('DATABASE_URL'),
};
