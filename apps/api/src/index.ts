import { createApp } from './app.ts';
import { config } from './config.ts';

const app = createApp();

app.listen(config.port, config.host, (err) => {
  if (err) {
    throw err;
  }

  console.log(`[api] listening on http://${config.host}:${config.port}`);
});
