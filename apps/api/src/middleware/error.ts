import type { ErrorRequestHandler } from 'express';
import z from 'zod';

export const zodErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json(z.treeifyError(err));
  }

  throw err;
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[api] unhandled error:', err);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({ error: 'internal_server_error', message: 'Internal server error.' });
};
