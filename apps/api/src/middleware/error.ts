import type { ErrorRequestHandler } from 'express';
import z from 'zod';

import type { Logger } from '../logger.ts';

export function payloadErrorHandler(): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    if (err instanceof Error && 'type' in err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'file_too_large' });
    }

    throw err;
  };
}

export function zodErrorHandler({ logger }: { logger: Logger }): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (err instanceof z.ZodError) {
      const issues = z.treeifyError(err);

      logger.warn('rejected an invalid body', { issues });

      return res.status(400).json(issues);
    }

    throw err;
  };
}

export function errorHandler({ logger }: { logger: Logger }): ErrorRequestHandler {
  return (err, req, res, _next) => {
    logger.error('unhandled error', { err });

    if (res.headersSent) {
      return;
    }

    res.status(500).json({ error: 'internal_server_error', message: 'Internal server error.' });
  };
}
