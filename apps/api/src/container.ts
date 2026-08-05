import { defined } from '@festivapp/utils';
import { AsyncLocalStorage } from 'node:async_hooks';

import { envConfig, type Config } from './config.ts';
import { createDatabase, type Database } from './db/client.ts';
import { consoleLogger, type Logger } from './logger.ts';
import { createPush, type Push } from './push.ts';
import { createStorage, type Storage } from './storage.ts';

export type Container = {
  config: Config;
  logger: Logger;
  db: Database;
  storage: Storage;
  push: Push;
  close(): Promise<void>;
};

const store = new AsyncLocalStorage<Container>();

export async function createContainer(overrides: Partial<Container> = {}): Promise<Container> {
  const config = overrides.config ?? envConfig();
  const logger = overrides.logger ?? consoleLogger({ level: config.logLevel });
  const scoped = scopedLogger(logger);

  const handle = await createDatabase(config, scoped);

  const db = overrides.db ?? handle.db;
  const storage = overrides.storage ?? createStorage(config);
  const push = overrides.push ?? createPush({ config, db, logger: scoped });

  return { config, logger, db, storage, push, close: () => handle.close(), ...overrides };
}

export function runWithContainer<T>(container: Container, fn: () => T): T {
  return store.run(container, fn);
}

export function deps(): Container {
  return defined(store.getStore(), new Error('deps() was called outside of runWithContainer()'));
}

function scopedLogger(fallback: Logger): Logger {
  const current = () => store.getStore()?.logger ?? fallback;

  return {
    level: fallback.level,
    debug: (message, context) => current().debug(message, context),
    info: (message, context) => current().info(message, context),
    warn: (message, context) => current().warn(message, context),
    error: (message, context) => current().error(message, context),
    child: (context) => current().child(context),
  };
}
