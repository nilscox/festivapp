import { Router } from 'express';

import { requireOrganizer, requireTenantMembership } from '../../middleware/admin-auth.ts';
import { authRouter } from './auth.ts';
import { locationsRouter } from './locations.ts';

export const adminRouter = Router();

adminRouter.use('/auth', authRouter);
adminRouter.use('/tenants/:tenantId/locations', requireOrganizer, requireTenantMembership, locationsRouter);

adminRouter.use((_req, res) => {
  res.status(404).json({ error: 'not_found' });
});
