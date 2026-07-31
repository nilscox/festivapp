import type { Message as MessageDto } from '@festivapp/contracts';
import { sub } from 'date-fns';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { useApi } from './helpers/api.ts';
import { createMessage, createOrganizer, createTenant } from './helpers/fixtures.ts';

import type { Tenant } from '../src/db/schema.ts';

const api = useApi();

let tenant: Tenant;
let other: Tenant;

beforeEach(async () => {
  tenant = await createTenant();
  other = await createTenant();

  const organizer = await createOrganizer({ password: 'hunter2', tenants: [tenant, other] });
  await api.login(organizer.email, 'hunter2');
});

describe('messages', () => {
  it('publishes a message', async () => {
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

  it('publishes a message asking for a notification', async () => {
    const res = await api.post<MessageDto>(`/admin/tenants/${tenant.id}/messages`, {
      title: 'Gates are open',
      body: 'Come on in.',
      notify: true,
    });

    assert.equal(res.status, 201);
  });

  it('lists the festival messages, newest first', async () => {
    const older = await createMessage(tenant, { title: 'Older', createdAt: sub(Date.now(), { hours: 1 }) });
    const newer = await createMessage(tenant, { title: 'Newer' });
    await createMessage(other, { title: 'Elsewhere' });

    const res = await api.get<MessageDto[]>(`/admin/tenants/${tenant.id}/messages`);

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.map(({ id }) => id),
      [newer.id, older.id],
    );
  });

  it('updates a message', async () => {
    const message = await createMessage(tenant, { title: 'Gates are open', body: 'Come on in.' });

    const res = await api.patch<MessageDto>(`/admin/tenants/${tenant.id}/messages/${message.id}`, {
      title: 'Gates are closed',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Gates are closed');
    assert.equal(res.body.body, 'Come on in.');
  });

  it('deletes a message', async () => {
    const message = await createMessage(tenant);

    const res = await api.delete(`/admin/tenants/${tenant.id}/messages/${message.id}`);
    assert.equal(res.status, 204);

    const list = await api.get<MessageDto[]>(`/admin/tenants/${tenant.id}/messages`);
    assert.deepEqual(list.body, []);
  });

  it('rejects an invalid body with a validation tree', async () => {
    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/messages`, {
      title: '',
      body: '',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.title);
    assert.ok(res.body.properties?.body);
  });

  it('refuses to notify from an update', async () => {
    const message = await createMessage(tenant);

    const res = await api.patch(`/admin/tenants/${tenant.id}/messages/${message.id}`, { notify: true });

    assert.equal(res.status, 400);
  });
});

describe('messages of another festival', () => {
  it('are not reachable for update', async () => {
    const message = await createMessage(other, { title: 'Elsewhere' });

    const res = await api.patch(`/admin/tenants/${tenant.id}/messages/${message.id}`, { title: 'Hijacked' });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'not_found' });
  });

  it('are not reachable for deletion', async () => {
    const message = await createMessage(other, { title: 'Elsewhere' });

    const res = await api.delete(`/admin/tenants/${tenant.id}/messages/${message.id}`);

    assert.equal(res.status, 404);
  });
});
