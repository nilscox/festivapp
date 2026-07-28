import { Router } from 'express';

import { requireOrganizer, requireTenantMembership } from '../../middleware/admin-auth.ts';
import { authRouter } from './auth.ts';
import { filesRouter } from './files.ts';
import { locationsRouter } from './locations.ts';
import { participantsRouter } from './participants.ts';
import { themeRouter } from './theme.ts';

export const adminRouter = Router();
const tenantRouter = Router();

adminRouter.use('/auth', authRouter);
adminRouter.use('/tenants/:tenantId', requireOrganizer, requireTenantMembership, tenantRouter);

tenantRouter.use('/files', filesRouter);
tenantRouter.use('/locations', locationsRouter);
tenantRouter.use('/participants', participantsRouter);
tenantRouter.use('/theme', themeRouter);
