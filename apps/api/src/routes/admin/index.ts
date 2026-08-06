import { Router } from 'express';

import { requireOrganizer, requireTenantMembership } from '../../middleware/admin-auth.ts';
import { authRoutes } from './auth.ts';
import { filesRoutes } from './files.ts';
import { locationsRoutes } from './locations.ts';
import { messagesRoutes } from './messages.ts';
import { participantsRoutes } from './participants.ts';
import { sessionsRoutes } from './sessions.ts';
import { tenantRoutes } from './tenant.ts';
import { themeRoutes } from './theme.ts';

import type { Config } from '../../config.ts';
import type { Database } from '../../db/client.ts';
import type { Logger } from '../../logger.ts';
import type { Push } from '../../push.ts';
import type { Storage } from '../../storage.ts';

export function adminRoutes({
  config,
  logger,
  db,
  storage,
  push,
}: {
  config: Config;
  logger: Logger;
  db: Database;
  storage: Storage;
  push: Push;
}) {
  const router = Router();
  const tenantRouter = Router();

  router.use('/auth', authRoutes({ logger, db }));

  router.use(
    '/tenants/:tenantId',
    requireOrganizer({ logger, db }),
    requireTenantMembership({ logger, db }),
    tenantRouter,
  );

  tenantRouter.use(tenantRoutes({ db }));
  tenantRouter.use('/files', filesRoutes({ config, db, storage }));
  tenantRouter.use('/locations', locationsRoutes({ db }));
  tenantRouter.use('/messages', messagesRoutes({ logger, db, push }));
  tenantRouter.use('/participants', participantsRoutes({ db }));
  tenantRouter.use('/sessions', sessionsRoutes({ db }));
  tenantRouter.use('/theme', themeRoutes({ db }));

  return router;
}
