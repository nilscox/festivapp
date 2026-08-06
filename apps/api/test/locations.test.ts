import type { Location as LocationDto } from '@festivapp/contracts';
import { get } from '@festivapp/utils';
import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

async function setup(t: TestContext) {
  const api = suite.api(t);
  const tenant = await create.tenant();
  const other = await create.tenant();
  const organizer = await create.organizer({ password: 'hunter2', tenants: [tenant, other] });

  await api.login(organizer.email, 'hunter2');

  return { api, tenant, other };
}

describe('locations', () => {
  it('creates a location at the centre of the map', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<LocationDto>(`/admin/tenants/${tenant.id}/locations`, {
      name: '  Main stage  ',
      description: '',
      position: 2,
    });

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      name: 'Main stage',
      description: null,
      position: 2,
      mapPin: { x: 50, y: 50, labelPosition: 'bottom' },
    });
  });

  it('lists the festival locations by position', async (t) => {
    const { api, tenant, other } = await setup(t);

    const second = await create.location(tenant, { name: 'Second', position: 2 });
    const first = await create.location(tenant, { name: 'First', position: 1 });
    await create.location(other, { name: 'Elsewhere' });

    const res = await api.get<LocationDto[]>(`/admin/tenants/${tenant.id}/locations`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map(get('id')), [first.id, second.id]);
  });

  it('updates a location, flattening the map pin', async (t) => {
    const { api, tenant } = await setup(t);

    const location = await create.location(tenant, { name: 'Main stage' });

    const res = await api.patch<LocationDto>(`/admin/tenants/${tenant.id}/locations/${location.id}`, {
      name: 'Second stage',
      mapPin: { x: 10, y: 20, labelPosition: 'left' },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Second stage');
    assert.deepEqual(res.body.mapPin, { x: 10, y: 20, labelPosition: 'left' });
  });

  it('keeps the fields a patch omits', async (t) => {
    const { api, tenant } = await setup(t);

    const location = await create.location(tenant, { name: 'Main stage', description: 'Outdoors', position: 3 });

    const res = await api.patch<LocationDto>(`/admin/tenants/${tenant.id}/locations/${location.id}`, {
      mapPin: { x: 10, y: 20 },
    });

    assert.partialDeepStrictEqual(res.body, {
      name: 'Main stage',
      description: 'Outdoors',
      position: 3,
      mapPin: { x: 10, y: 20, labelPosition: 'bottom' },
    });
  });

  it('deletes a location', async (t) => {
    const { api, tenant } = await setup(t);

    const location = await create.location(tenant);

    const res = await api.delete(`/admin/tenants/${tenant.id}/locations/${location.id}`);
    assert.equal(res.status, 204);

    const list = await api.get<LocationDto[]>(`/admin/tenants/${tenant.id}/locations`);
    assert.deepEqual(list.body, []);
  });

  it('rejects an invalid body with a validation tree', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/locations`, {
      name: '',
      position: -1,
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.name);
    assert.ok(res.body.properties?.position);
  });

  it('rejects unknown fields', async (t) => {
    const { api, tenant, other } = await setup(t);

    const res = await api.post(`/admin/tenants/${tenant.id}/locations`, {
      name: 'Main stage',
      position: 0,
      tenantId: other.id,
    });

    assert.equal(res.status, 400);
  });
});

describe('locations of another festival', () => {
  it('are not reachable for update', async (t) => {
    const { api, tenant, other } = await setup(t);

    const location = await create.location(other, { name: 'Elsewhere' });

    const res = await api.patch(`/admin/tenants/${tenant.id}/locations/${location.id}`, { name: 'Hijacked' });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'not_found' });
  });

  it('are not reachable for deletion', async (t) => {
    const { api, tenant, other } = await setup(t);

    const location = await create.location(other, { name: 'Elsewhere' });

    const res = await api.delete(`/admin/tenants/${tenant.id}/locations/${location.id}`);

    assert.equal(res.status, 404);
  });
});
