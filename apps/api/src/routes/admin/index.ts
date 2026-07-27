import { Router } from 'express';

import { requireOrganizer, requireTenantMembership } from '../../middleware/admin-auth.ts';
import { authRouter } from './auth.ts';
import { locationsRouter } from './locations.ts';

export const adminRouter = Router();
const tenantRouter = Router();

adminRouter.use('/auth', authRouter);
adminRouter.use('/tenants/:tenantId', requireOrganizer, requireTenantMembership, tenantRouter);

tenantRouter.use('/locations', locationsRouter);
