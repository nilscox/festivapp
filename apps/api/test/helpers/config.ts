import type { Config } from '../../src/config.ts';

export function testConfig(overrides: Partial<Config> = {}): Config {
  return {
    env: 'test',
    host: '',
    port: NaN,
    logLevel: 'info',
    databaseUrl: undefined,
    storageDir: undefined,
    uploadMaxBytes: undefined,
    vapidPublicKey: undefined,
    vapidPrivateKey: undefined,
    vapidSubject: '',
    ...overrides,
  };
}
