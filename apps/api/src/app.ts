import express, { type Express, type RequestHandler } from 'express';

import { errorHandler, payloadErrorHandler, zodErrorHandler } from './middleware/error.ts';
import { requestLogger } from './middleware/logging.ts';
import { requestContext } from './middleware/request-context.ts';
import { adminRoutes } from './routes/admin/index.ts';
import { appRoutes } from './routes/app/index.ts';
import { publicFilesRoutes } from './routes/public-files.ts';

import type { Config } from './config.ts';
import type { Database } from './db/client.ts';
import type { Logger } from './logger.ts';
import type { Push } from './push.ts';
import type { Storage } from './storage.ts';

export function createApp({
  config,
  logger,
  db,
  storage,
  push,
}: {
  config: Config;
  logger: Logger;
  db: Database;
  storage: Storage;
  push: Push;
}): Express {
  const app = express();

  app.use(requestContext());
  app.use(requestLogger({ logger }));
  app.use(express.json());

  app.get('/health', health({ logger, db }));
  app.use('/files', publicFilesRoutes({ db, storage }));
  app.use('/admin', adminRoutes({ config, logger, db, storage, push }));
  app.use(appRoutes({ config, logger, db, push }));
  app.use(notFound());

  app.use(payloadErrorHandler());
  app.use(zodErrorHandler({ logger }));
  app.use(errorHandler({ logger }));

  return app;
}

function health({ logger, db }: { logger: Logger; db: Database }): RequestHandler {
  return async (req, res) => {
    if ('db' in req.query) {
      try {
        await db.execute('SELECT 1');
      } catch (error) {
        logger.error('health check could not reach the database', { error });
        return res.status(503).json({ status: 'degraded' });
      }
    }

    res.json({ status: 'ok' });
  };
}

function notFound(): RequestHandler {
  return (_req, res) => {
    res.status(404).json({ error: 'not_found' });
  };
}
