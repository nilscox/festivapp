import { Router } from 'express';

import { requireTenant } from '../../middleware/tenant.ts';
import { bootstrapRouter } from './bootstrap.ts';
import { manifestRouter } from './manifest.ts';

export const tenantRouter = Router();

tenantRouter.use(requireTenant);
tenantRouter.use(bootstrapRouter);
tenantRouter.use(manifestRouter);
