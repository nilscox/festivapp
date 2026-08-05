import type { ErrorRequestHandler } from 'express';
import z from 'zod';

export const payloadErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof Error && 'type' in err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'file_too_large' });
  }

  throw err;
};

export const zodErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const logger = req.container.resolve('logger');

  if (err instanceof z.ZodError) {
    const issues = z.treeifyError(err);

    logger.warn('rejected an invalid body', { issues });

    return res.status(400).json(issues);
  }

  throw err;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const logger = req.container.resolve('logger');

  logger.error('unhandled error', { err });

  if (res.headersSent) {
    return;
  }

  res.status(500).json({ error: 'internal_server_error', message: 'Internal server error.' });
};
