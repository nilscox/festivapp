import express, { type Express, type Request, type Response } from 'express';

import { errorHandler, zodErrorHandler } from './middleware/error.ts';
import { adminRouter } from './routes/admin/index.ts';
import { tenantRouter } from './routes/app/index.ts';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/health', health);
  app.use('/admin', adminRouter);
  app.use(tenantRouter);

  app.use(zodErrorHandler);
  app.use(errorHandler);
  app.use(notFound);

  return app;
}

function health(_req: Request, res: Response) {
  res.json({ status: 'ok' });
}

function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found' });
}
