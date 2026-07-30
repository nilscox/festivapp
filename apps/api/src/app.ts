import express, { type Express, type Request, type Response } from 'express';

import { errorHandler, payloadErrorHandler, zodErrorHandler } from './middleware/error.ts';
import { adminRouter } from './routes/admin/index.ts';
import { tenantRouter } from './routes/app/index.ts';
import { filesRouter } from './routes/files.ts';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', health);
  app.use('/files', filesRouter);
  app.use('/admin', adminRouter);
  app.use(tenantRouter);
  app.use(notFound);

  app.use(payloadErrorHandler);
  app.use(zodErrorHandler);
  app.use(errorHandler);

  return app;
}

function health(_req: Request, res: Response) {
  res.json({ status: 'ok' });
}

function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found' });
}
