import { createApp } from './app.ts';
import { createContainer } from './container.ts';

const container = await createContainer();
const { config, logger } = container;

const app = createApp(container);

app.listen(config.port, config.host, (err) => {
  if (err) {
    throw err;
  }

  logger.info(`listening on http://${config.host}:${config.port}`);
});
