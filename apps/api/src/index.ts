import { assert } from '@festivapp/utils';

import { createApp } from './app.ts';
import { envConfig } from './config.ts';
import { applyMigrations, createDatabase } from './db/client.ts';
import { consoleLogger } from './logger.ts';
import { createPush } from './push.ts';
import { createStorage } from './storage.ts';

const config = envConfig();
const logger = consoleLogger({ config });
const db = createDatabase({ config, logger });
const push = createPush({ config, logger, db });
const storage = createStorage({ config });

if (!config.databaseUrl) {
  assert(config.env !== 'production', new Error('Missing DATABASE_URL'));
  await applyMigrations(db);
}

const app = createApp({ config, logger, db, push, storage });

app.listen(config.port, config.host, (err) => {
  if (err) {
    throw err;
  }

  logger.info(`listening on http://${config.host}:${config.port}`, {
    database: config.databaseUrl ? 'postgres' : 'memory',
    storage: config.storageDir ?? 'memory',
    push: push.enabled,
  });
});
