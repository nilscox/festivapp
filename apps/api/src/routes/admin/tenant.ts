import type { Tenant as TenantDto } from '@festivapp/contracts';
import { eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';

import { db } from '../../db/client.ts';
import { type Tenant, tenants } from '../../db/schema.ts';
import { assert } from '../../utils.ts';

export const tenantRouter = Router({ mergeParams: true });

function toTenantDto(row: Tenant): TenantDto {
  return { id: row.id, name: row.name, domain: row.domain, timezone: row.timezone };
}

tenantRouter.get('/', (req, res) => {
  assert(req.tenant);

  res.json(toTenantDto(req.tenant));
});

const timezones = new Set(Intl.supportedValuesOf('timeZone'));
const hostname = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/;

const schema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  domain: z.string().trim().toLowerCase().max(253).regex(hostname, 'must be a host name'),
  timezone: z.string().refine((value) => timezones.has(value), 'must be an IANA timezone'),
});

tenantRouter.put('/', async (req, res) => {
  assert(req.tenant);

  const { name, domain, timezone } = schema.parse(req.body);
  const owner = await db.query.tenants.findFirst({ where: { domain } });

  if (owner && owner.id !== req.tenant.id) {
    return res.status(409).json({ error: 'domain_taken' });
  }

  const [row] = await db
    .update(tenants)
    .set({ name, domain, timezone, updatedAt: new Date() })
    .where(eq(tenants.id, req.tenant.id))
    .returning();

  assert(row);

  res.json(toTenantDto(row));
});
