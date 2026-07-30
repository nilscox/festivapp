import type { Tenant as TenantDto } from '@festivapp/contracts';
import { assert } from '@festivapp/utils';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../db/client.ts';
import { type Tenant, tenants } from '../../db/schema.ts';

export const tenantRouter = Router({ mergeParams: true });

function toTenantDto(row: Tenant): TenantDto {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    timezone: row.timezone,
    mapUrl: row.mapUrl,
  };
}

tenantRouter.get('/', (req, res) => {
  assert(req.tenant);

  res.json(toTenantDto(req.tenant));
});

const timezones = new Set(Intl.supportedValuesOf('timeZone'));
const hostname = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

const schema = z
  .strictObject({
    name: z.string().trim().min(1).max(100),
    domain: z.string().trim().toLowerCase().max(253).regex(hostname, 'must be a host name'),
    timezone: z.string().refine((value) => timezones.has(value), 'must be an IANA timezone'),
    mapUrl: z.string().trim().nullable(),
  })
  .partial();

tenantRouter.patch('/', async (req, res) => {
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

  assert(row);

  res.json(toTenantDto(row));
});
