import type { Tenant as TenantDto } from '@festivapp/contracts';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { TestApi } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

import type { Tenant } from '../src/db/schema.ts';

const api = TestApi.create();
const create = fixtures(api.db);

let tenant: Tenant;
let other: Tenant;

beforeEach(async () => {
  tenant = await create.tenant({ domain: 'coolfest.localhost', name: 'Cool Fest', mapUrl: '/files/map' });
  other = await create.tenant();

  const organizer = await create.organizer({ password: 'hunter2', tenants: [tenant, other] });
  await api.login(organizer.email, 'hunter2');
});

describe('GET /admin/tenants/:tenantId', () => {
  it('returns the festival, and nothing but the contract fields', async () => {
    const res = await api.get<TenantDto>(`/admin/tenants/${tenant.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      id: tenant.id,
      name: 'Cool Fest',
      domain: 'coolfest.localhost',
      timezone: 'Europe/Paris',
      mapUrl: '/files/map',
      registeredSubscriptions: 0,
    });
  });

  it('counts only the devices registered to this festival', async () => {
    await create.pushSubscription(tenant);
    await create.pushSubscription(tenant);
    await create.pushSubscription(other);

    const res = await api.get<TenantDto>(`/admin/tenants/${tenant.id}`);

    assert.equal(res.body.registeredSubscriptions, 2);
  });
});

describe('PATCH /admin/tenants/:tenantId', () => {
  it('answers with the updated festival and its device count', async () => {
    await create.pushSubscription(tenant);

    const res = await api.patch<TenantDto>(`/admin/tenants/${tenant.id}`, { name: 'Cooler Fest' });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Cooler Fest');
    assert.equal(res.body.registeredSubscriptions, 1);
  });
});
