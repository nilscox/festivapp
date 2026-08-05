import { asValue, type AwilixContainer } from 'awilix';
import type { RequestHandler } from 'express';

import { type Dependencies } from '../container.ts';
import { createId } from '../utils.ts';

declare global {
  namespace Express {
    interface Request {
      container: AwilixContainer<Dependencies>;
    }
  }
}

export function provideContainer(parent: AwilixContainer<Dependencies>): RequestHandler {
  return (req, res, next) => {
    const requestId = createId();
    const scoped = parent.createScope();

    scoped.register({
      logger: asValue(parent.resolve('logger').child({ requestId })),
    });

    req.container = scoped;
    res.setHeader('X-Request-ID', requestId);
    next();
  };
}
