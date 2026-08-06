import type { RequestHandler } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';

import { createId } from '../utils.ts';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

const store = new AsyncLocalStorage<string>();

export function requestContext(): RequestHandler {
  return (req, res, next) => {
    const requestId = createId();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    store.run(requestId, next);
  };
}

export function getRequestId() {
  return store.getStore();
}
