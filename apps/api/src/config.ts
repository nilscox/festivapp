export type Config = ReturnType<typeof envConfig>;

export function envConfig() {
  return {
    env: env('NODE_ENV', 'development'),
    host: env('HOST', '127.0.0.1'),
    port: Number(env('PORT', '3000')),
    logLevel: env('LOG_LEVEL', 'info'),
    databaseUrl: env('DATABASE_URL'),
    storageDir: env('STORAGE_DIR'),
    uploadMaxBytes: env('UPLOAD_MAX_BYTES'),
    vapidPublicKey: env('VAPID_PUBLIC_KEY'),
    vapidPrivateKey: env('VAPID_PRIVATE_KEY'),
    vapidSubject: env('VAPID_SUBJECT', 'mailto:admin@festivapp.local'),
  };
}

function env(name: string): string | undefined;
function env(name: string, defaultValue: string): string;
function env(name: string, defaultValue?: string) {
  return process.env[name] || defaultValue;
}
