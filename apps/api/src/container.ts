import { asFunction, createContainer, InjectionMode } from 'awilix';

import { envConfig, type Config } from './config.ts';
import {
  applyMigrations,
  closeDatabaseClient,
  createDatabase,
  createDatabaseClient,
  type Database,
  type DatabaseClient,
} from './db/client.ts';
import { consoleLogger, type Logger } from './logger.ts';
import { createPush, type Push } from './push.ts';
import { createStorage, type Storage } from './storage.ts';

export type Dependencies = {
  config: Config;
  logger: Logger;
  client: DatabaseClient;
  db: Database;
  storage: Storage;
  push: Push;
};

export const container = createContainer<Dependencies>({
  injectionMode: InjectionMode.PROXY,
  strict: true,
});

export function initContainer() {
  container.register({
    config: asFunction(envConfig).singleton(),
    logger: asFunction(({ config }) => consoleLogger({ level: config.logLevel })).singleton(),
    client: asFunction(createDatabaseClient).singleton().disposer(closeDatabaseClient),
    db: asFunction(createDatabase).scoped(),
    storage: asFunction(createStorage).singleton(),
    push: asFunction(createPush).scoped(),
  });
}

initContainer();

const config = container.resolve('config');

if (!config.databaseUrl) {
  await applyMigrations(container.resolve('db'));
}
