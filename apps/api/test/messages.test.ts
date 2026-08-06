import type { Message as MessageDto } from '@festivapp/contracts';
import { get } from '@festivapp/utils';
import { sub } from 'date-fns';
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

describe('messages', () => {
  it('publishes a message', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<MessageDto>(`/admin/tenants/${tenant.id}/messages`, {
      title: '  Gates are open  ',
      body: '  Come on in.  ',
    });

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      title: 'Gates are open',
      body: 'Come on in.',
    });
  });

  it('publishes a message asking for a notification', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<MessageDto>(`/admin/tenants/${tenant.id}/messages`, {
      title: 'Gates are open',
      body: 'Come on in.',
      notify: true,
    });

    assert.equal(res.status, 201);
  });

  it('lists the festival messages, newest first', async (t) => {
    const { api, tenant, other } = await setup(t);

    const older = await create.message(tenant, { title: 'Older', createdAt: sub(Date.now(), { hours: 1 }) });
    const newer = await create.message(tenant, { title: 'Newer' });
    await create.message(other, { title: 'Elsewhere' });

    const res = await api.get<MessageDto[]>(`/admin/tenants/${tenant.id}/messages`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map(get('id')), [newer.id, older.id]);
  });

  it('updates a message', async (t) => {
    const { api, tenant } = await setup(t);

    const message = await create.message(tenant, { title: 'Gates are open', body: 'Come on in.' });

    const res = await api.patch<MessageDto>(`/admin/tenants/${tenant.id}/messages/${message.id}`, {
      title: 'Gates are closed',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Gates are closed');
    assert.equal(res.body.body, 'Come on in.');
  });

  it('deletes a message', async (t) => {
    const { api, tenant } = await setup(t);

    const message = await create.message(tenant);

    const res = await api.delete(`/admin/tenants/${tenant.id}/messages/${message.id}`);
    assert.equal(res.status, 204);

    const list = await api.get<MessageDto[]>(`/admin/tenants/${tenant.id}/messages`);
    assert.deepEqual(list.body, []);
  });

  it('rejects an invalid body with a validation tree', async (t) => {
    const { api, tenant } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/messages`, {
      title: '',
      body: '',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.title);
    assert.ok(res.body.properties?.body);
  });

  it('refuses to notify from an update', async (t) => {
    const { api, tenant } = await setup(t);

    const message = await create.message(tenant);

    const res = await api.patch(`/admin/tenants/${tenant.id}/messages/${message.id}`, { notify: true });

    assert.equal(res.status, 400);
  });
});

describe('messages of another festival', () => {
  it('are not reachable for update', async (t) => {
    const { api, tenant, other } = await setup(t);

    const message = await create.message(other, { title: 'Elsewhere' });

    const res = await api.patch(`/admin/tenants/${tenant.id}/messages/${message.id}`, { title: 'Hijacked' });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'not_found' });
  });

  it('are not reachable for deletion', async (t) => {
    const { api, tenant, other } = await setup(t);

    const message = await create.message(other, { title: 'Elsewhere' });

    const res = await api.delete(`/admin/tenants/${tenant.id}/messages/${message.id}`);

    assert.equal(res.status, 404);
  });
});
