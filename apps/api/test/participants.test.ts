import type { Participant as ParticipantDto } from '@festivapp/contracts';
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

describe('participants', () => {
  it('creates a participant, and nothing but the contract fields', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<ParticipantDto>(`/admin/tenants/${tenant.id}/participants`, {
      name: '  Johnny Purple  ',
      description: '  ',
      imageUrl: '/files/abc',
      origin: 'FR',
      label: 'Purple Records',
      styles: ['psytrance', '', ' forest '],
      socialLinks: ['https://example.com/johnny', ''],
    });

    assert.equal(res.status, 201);
    assert.deepEqual(res.body, {
      id: res.body.id,
      name: 'Johnny Purple',
      description: null,
      imageUrl: '/files/abc',
      origin: 'FR',
      label: 'Purple Records',
      styles: ['psytrance', 'forest'],
      socialLinks: ['https://example.com/johnny'],
    });
  });

  it('lists the festival participants by name', async (t) => {
    const { api, tenant, other } = await setup(t);

    const zoe = await create.participant(tenant, { name: 'Zoe' });
    const amir = await create.participant(tenant, { name: 'Amir' });
    await create.participant(other, { name: 'Elsewhere' });

    const res = await api.get<ParticipantDto[]>(`/admin/tenants/${tenant.id}/participants`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map(get('id')), [amir.id, zoe.id]);
  });

  it('updates a participant, keeping the fields the patch omits', async (t) => {
    const { api, tenant } = await setup(t);

    const participant = await create.participant(tenant, { name: 'Johnny Purple', origin: 'FR' });

    const res = await api.patch<ParticipantDto>(`/admin/tenants/${tenant.id}/participants/${participant.id}`, {
      name: 'Johnny Green',
    });

    assert.equal(res.status, 200);
    assert.partialDeepStrictEqual(res.body, { name: 'Johnny Green', origin: 'FR' });
  });

  it('deletes a participant', async (t) => {
    const { api, tenant } = await setup(t);

    const participant = await create.participant(tenant);

    const res = await api.delete(`/admin/tenants/${tenant.id}/participants/${participant.id}`);
    assert.equal(res.status, 204);

    const list = await api.get<ParticipantDto[]>(`/admin/tenants/${tenant.id}/participants`);
    assert.deepEqual(list.body, []);
  });

  it('rejects an invalid body with a validation tree', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/participants`, {
      name: '',
      socialLinks: ['not-a-url'],
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.name);
  });
});

describe('participants of another festival', () => {
  it('are not reachable for update', async (t) => {
    const { api, tenant, other } = await setup(t);

    const participant = await create.participant(other, { name: 'Elsewhere' });

    const res = await api.patch(`/admin/tenants/${tenant.id}/participants/${participant.id}`, { name: 'Hijacked' });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'not_found' });
  });

  it('are not reachable for deletion', async (t) => {
    const { api, tenant, other } = await setup(t);

    const participant = await create.participant(other, { name: 'Elsewhere' });

    const res = await api.delete(`/admin/tenants/${tenant.id}/participants/${participant.id}`);

    assert.equal(res.status, 404);
  });
});
