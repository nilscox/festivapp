import { Router } from 'express';

import { requireTenant } from '../../middleware/tenant.ts';
import { bootstrapRoutes } from './bootstrap.ts';
import { manifestRoutes } from './manifest.ts';
import { pushRoutes } from './push.ts';

import type { Config } from '../../config.ts';
import type { Database } from '../../db/client.ts';
import type { Logger } from '../../logger.ts';
import type { Push } from '../../push.ts';

export function appRoutes({ config, logger, db, push }: { config: Config; logger: Logger; db: Database; push: Push }) {
  const router = Router();

  router.use(requireTenant({ logger, db }));
  router.use('/bootstrap', bootstrapRoutes({ config, db }));
  router.use('/manifest.webmanifest', manifestRoutes());
  router.use('/push/subscriptions', pushRoutes({ db, push }));

  return router;
}
