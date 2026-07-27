import type { Organizer as OrganizerDto, TenantSummary } from '@festivapp/contracts';
import { asc, eq } from 'drizzle-orm';

import { db } from '../../db/client.ts';
import { type Organizer, organizerTenants, tenants } from '../../db/schema.ts';

export function toOrganizerDto(organizer: Organizer): OrganizerDto {
  return { id: organizer.id, email: organizer.email, name: organizer.name };
}

export async function listOrganizerTenants(organizerId: string): Promise<TenantSummary[]> {
  const rows = await db
    .select({ id: tenants.id, name: tenants.name, domain: tenants.domain })
    .from(organizerTenants)
    .innerJoin(tenants, eq(organizerTenants.tenantId, tenants.id))
    .where(eq(organizerTenants.organizerId, organizerId))
    .orderBy(asc(tenants.name));

  return rows;
}
