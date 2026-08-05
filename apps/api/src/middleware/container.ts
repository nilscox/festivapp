import type { RequestHandler } from 'express';

import { runWithContainer, type Container } from '../container.ts';
import { createId } from '../utils.ts';

export function provideContainer(container: Container): RequestHandler {
  return (_req, _res, next) => {
    const logger = container.logger.child({ requestId: createId() });

    runWithContainer({ ...container, logger }, next);
  };
}
