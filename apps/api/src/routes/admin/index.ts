import { Router } from 'express';

import { requireOrganizer, requireTenantMembership } from '../../middleware/admin-auth.ts';
import { authRouter } from './auth.ts';
import { filesRouter } from './files.ts';
import { locationsRouter } from './locations.ts';
import { participantsRouter } from './participants.ts';
import { tenantRouter } from './tenant.ts';
import { themeRouter } from './theme.ts';

export const adminRouter = Router();
const router = Router();

adminRouter.use('/auth', authRouter);
adminRouter.use('/tenants/:tenantId', requireOrganizer, requireTenantMembership, router);

router.use(tenantRouter);
router.use('/files', filesRouter);
router.use('/locations', locationsRouter);
router.use('/participants', participantsRouter);
router.use('/theme', themeRouter);
