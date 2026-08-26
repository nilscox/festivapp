import type { Tenant as TenantDto, TenantTab } from '@festivapp/contracts';
import { assert, defined } from '@festivapp/utils';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { pushSubscriptions, type Tenant, tenants } from '../../db/schema.ts';
import { optionalString } from '../../utils.ts';

import type { Database } from '../../db/client.ts';

export function tenantRoutes({ db }: { db: Database }) {
  const router = Router({ mergeParams: true });

  router.get('/', async (req, res) => {
    assert(req.tenant);

    res.json(toTenantDto(req.tenant, await countPushSubscriptions(db, req.tenant.id)));
  });

  const timezones = new Set(Intl.supportedValuesOf('timeZone'));
  const hostname = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

  const schema = z
    .strictObject({
      name: z.string().trim().min(1).max(100),
      domain: z.string().trim().toLowerCase().max(253).regex(hostname, 'must be a host name'),
      timezone: z.string().refine((value) => timezones.has(value), 'must be an IANA timezone'),
      mapUrl: optionalString().pipe(z.string().startsWith('/').nullable()),
      tabs: z.array(z.enum(['home', 'timetable', 'map', 'info'] satisfies TenantTab[])).min(1),
    })
    .partial();

  router.patch('/', async (req, res) => {
    assert(req.tenant);

    const values = schema.parse(req.body);

    if (values.domain !== undefined) {
      const owner = await db.query.tenants.findFirst({ where: { domain: values.domain } });

      if (owner && owner.id !== req.tenant.id) {
        return res.status(409).json({ error: 'domain_taken' });
      }
    }

    const [row] = await db
      .update(tenants)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(tenants.id, req.tenant.id))
      .returning();

    res.json(toTenantDto(defined(row), await countPushSubscriptions(db, req.tenant.id)));
  });

  return router;
}

function toTenantDto(row: Tenant, registeredSubscriptions: number): TenantDto {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    timezone: row.timezone,
    mapUrl: row.mapUrl,
    tabs: row.tabs,
    registeredSubscriptions,
  };
}

function countPushSubscriptions(db: Database, tenantId: string) {
  return db.$count(pushSubscriptions, eq(pushSubscriptions.tenantId, tenantId));
}
