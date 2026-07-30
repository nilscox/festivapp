function env(name: string): string | undefined;
function env(name: string, defaultValue: string): string;
function env(name: string, defaultValue?: string) {
  return process.env[name] || defaultValue;
}

export const config = {
  host: env('HOST', 'localhost'),
  port: Number(env('PORT', '3000')),
  databaseUrl: env('DATABASE_URL'),
  storageDir: env('STORAGE_DIR'),
  uploadMaxBytes: env('UPLOAD_MAX_BYTES'),
};
