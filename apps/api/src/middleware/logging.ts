import type { RequestHandler } from 'express';

export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = performance.now();

  res.on('finish', () => {
    const logger = req.container.resolve('logger');
    const duration = Math.round(performance.now() - startedAt);

    logger[levelOf(res.statusCode)](`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      tenant: req.tenant?.domain,
      organizer: req.organizer?.email,
    });
  });

  next();
};

function levelOf(status: number) {
  if (status >= 500) {
    return 'error';
  }

  if (status >= 400) {
    return 'warn';
  }

  return 'info';
}
