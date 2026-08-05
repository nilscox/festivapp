import { createApp } from './app.ts';
import { container } from './container.ts';

const config = container.resolve('config');
const app = createApp();

app.listen(config.port, config.host, (err) => {
  if (err) {
    throw err;
  }

  const logger = container.resolve('logger');
  const push = container.resolve('push');

  logger.info(`listening on http://${config.host}:${config.port}`, {
    database: config.databaseUrl ? 'postgres' : 'memory',
    storage: config.storageDir ?? 'memory',
    push: push.enabled,
  });
});
