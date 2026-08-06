import type { TenantTheme } from '@festivapp/contracts';
import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

async function setup(t: TestContext) {
  const api = suite.api(t);
  const tenant = await create.tenant();
  const organizer = await create.organizer({ password: 'hunter2', tenants: [tenant] });

  await api.login(organizer.email, 'hunter2');

  return { api, tenant };
}

describe('theme', () => {
  it('serves the festival theme', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.get<TenantTheme>(`/admin/tenants/${tenant.id}/theme`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, create.theme());
  });

  it('replaces the theme whole', async (t) => {
    const { api, tenant } = await setup(t);

    const theme = create.theme({ backgroundColor: '#101014', pwa: { name: 'Cool', shortName: 'Cool' } });

    const res = await api.put<TenantTheme>(`/admin/tenants/${tenant.id}/theme`, theme);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, theme);
  });

  it('rejects an invalid theme', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.put(`/admin/tenants/${tenant.id}/theme`, create.theme({ backgroundColor: 'not-a-color' }));

    assert.equal(res.status, 400);
  });
});
