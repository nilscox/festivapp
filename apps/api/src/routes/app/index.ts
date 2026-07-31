import { Router } from 'express';

import { requireTenant } from '../../middleware/tenant.ts';
import { bootstrapRouter } from './bootstrap.ts';
import { manifestRouter } from './manifest.ts';
import { pushRouter } from './push.ts';

export const tenantRouter = Router();

tenantRouter.use(requireTenant);
tenantRouter.use('/bootstrap', bootstrapRouter);
tenantRouter.use('/manifest.webmanifest', manifestRouter);
tenantRouter.use('/push/subscriptions', pushRouter);
