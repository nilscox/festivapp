import type { Tenant as TenantDto } from '@festivapp/contracts';
import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

async function setup(t: TestContext) {
  const api = suite.api(t);
  const tenant = await create.tenant({ domain: 'coolfest.localhost', name: 'Cool Fest', mapUrl: '/files/map' });
  const other = await create.tenant();
  const organizer = await create.organizer({ password: 'hunter2', tenants: [tenant, other] });

  await api.login(organizer.email, 'hunter2');

  return { api, tenant, other };
}

describe('GET /admin/tenants/:tenantId', () => {
  it('returns the festival, and nothing but the contract fields', async (t) => {
    const { api, tenant } = await setup(t);

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

  it('counts only the devices registered to this festival', async (t) => {
    const { api, tenant, other } = await setup(t);

    await create.pushSubscription(tenant);
    await create.pushSubscription(tenant);
    await create.pushSubscription(other);

    const res = await api.get<TenantDto>(`/admin/tenants/${tenant.id}`);

    assert.equal(res.body.registeredSubscriptions, 2);
  });
});

describe('PATCH /admin/tenants/:tenantId', () => {
  it('answers with the updated festival and its device count', async (t) => {
    const { api, tenant } = await setup(t);

    await create.pushSubscription(tenant);

    const res = await api.patch<TenantDto>(`/admin/tenants/${tenant.id}`, { name: 'Cooler Fest' });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Cooler Fest');
    assert.equal(res.body.registeredSubscriptions, 1);
  });
});
