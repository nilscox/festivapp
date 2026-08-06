import type { Session as SessionDto } from '@festivapp/contracts';
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
  const location = await create.location(tenant, { name: 'Main stage' });
  const johnny = await create.participant(tenant, { name: 'Johnny Purple' });
  const nova = await create.participant(tenant, { name: 'Nova Twins' });
  const organizer = await create.organizer({ password: 'hunter2', tenants: [tenant, other] });

  await api.login(organizer.email, 'hunter2');

  return { api, tenant, other, location, johnny, nova };
}

describe('sessions', () => {
  it('lists the festival sessions by start, line-up in order', async (t) => {
    const { api, tenant, other, location, johnny, nova } = await setup(t);

    const later = await create.session(tenant, location, {
      title: 'Closing set',
      startsAt: new Date('2026-07-01T23:00:00Z'),
      endsAt: new Date('2026-07-02T01:00:00Z'),
      participants: [nova, johnny],
    });

    const earlier = await create.session(tenant, location, {
      type: 'talk',
      title: 'Opening ceremony',
      description: 'Doors open.',
      startsAt: new Date('2026-07-01T18:00:00Z'),
      endsAt: new Date('2026-07-01T19:00:00Z'),
    });

    await create.session(other, await create.location(other));

    const res = await api.get<SessionDto[]>(`/admin/tenants/${tenant.id}/sessions`);

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, [
      {
        id: earlier.id,
        locationId: location.id,
        type: 'talk',
        title: 'Opening ceremony',
        description: 'Doors open.',
        participantIds: [],
        startsAt: '2026-07-01T18:00:00.000Z',
        endsAt: '2026-07-01T19:00:00.000Z',
      },
      {
        id: later.id,
        locationId: location.id,
        type: 'live',
        title: 'Closing set',
        description: null,
        participantIds: [nova.id, johnny.id],
        startsAt: '2026-07-01T23:00:00.000Z',
        endsAt: '2026-07-02T01:00:00.000Z',
      },
    ]);
  });

  it('creates a session with its line-up', async (t) => {
    const { api, tenant, location, johnny, nova } = await setup(t);

    const res = await api.post<SessionDto>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'dj_set',
      title: 'Nova b2b Johnny',
      description: null,
      participantIds: [nova.id, johnny.id],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:30:00.000Z',
    });

    assert.equal(res.status, 201);
    assert.partialDeepStrictEqual(res.body, {
      locationId: location.id,
      type: 'dj_set',
      title: 'Nova b2b Johnny',
      description: null,
      participantIds: [nova.id, johnny.id],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:30:00.000Z',
    });

    const list = await api.get<SessionDto[]>(`/admin/tenants/${tenant.id}/sessions`);
    assert.deepEqual(list.body[0]?.participantIds, [nova.id, johnny.id]);
  });

  it('creates a titleless session for the one person on it', async (t) => {
    const { api, tenant, location, johnny } = await setup(t);

    const res = await api.post<SessionDto>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'dj_set',
      title: '  ',
      participantIds: [johnny.id],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:30:00.000Z',
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, null);
  });

  it('creates a session with no line-up when it has a title', async (t) => {
    const { api, tenant, location } = await setup(t);

    const res = await api.post<SessionDto>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'workshop',
      title: 'Risograph poster lab',
      participantIds: [],
      startsAt: '2026-07-01T14:00:00.000Z',
      endsAt: '2026-07-01T16:00:00.000Z',
    });

    assert.equal(res.status, 201);
    assert.deepEqual(res.body.participantIds, []);
  });

  it('replaces a session whole, line-up included', async (t) => {
    const { api, tenant, location, johnny, nova } = await setup(t);

    const session = await create.session(tenant, location, {
      title: 'Closing set',
      description: 'Dropped on replace.',
      participants: [johnny],
    });

    const res = await api.put<SessionDto>(`/admin/tenants/${tenant.id}/sessions/${session.id}`, {
      locationId: location.id,
      type: 'dj_set',
      title: 'Closing set',
      participantIds: [nova.id, johnny.id],
      startsAt: '2026-07-01T22:00:00.000Z',
      endsAt: '2026-07-01T23:30:00.000Z',
    });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      id: session.id,
      locationId: location.id,
      type: 'dj_set',
      title: 'Closing set',
      description: null,
      participantIds: [nova.id, johnny.id],
      startsAt: '2026-07-01T22:00:00.000Z',
      endsAt: '2026-07-01T23:30:00.000Z',
    });

    const list = await api.get<SessionDto[]>(`/admin/tenants/${tenant.id}/sessions`);
    assert.deepEqual(list.body, [res.body]);
  });

  it('deletes a session and its line-up', async (t) => {
    const { api, tenant, location, johnny } = await setup(t);

    const session = await create.session(tenant, location, { participants: [johnny] });

    const res = await api.delete(`/admin/tenants/${tenant.id}/sessions/${session.id}`);
    assert.equal(res.status, 204);

    const list = await api.get<SessionDto[]>(`/admin/tenants/${tenant.id}/sessions`);
    assert.deepEqual(list.body, []);
  });

  it('allows two sessions to overlap at the same location', async (t) => {
    const { api, tenant, location } = await setup(t);

    await create.session(tenant, location, { title: 'First' });

    const res = await api.post(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'live',
      title: 'Second',
      participantIds: [],
      startsAt: '2026-07-01T20:30:00.000Z',
      endsAt: '2026-07-01T21:30:00.000Z',
    });

    assert.equal(res.status, 201);
  });
});

describe('session validation', () => {
  it('rejects an end at or before the start', async (t) => {
    const { api, tenant, location } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'live',
      title: 'Backwards',
      participantIds: [],
      startsAt: '2026-07-01T21:00:00.000Z',
      endsAt: '2026-07-01T20:00:00.000Z',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.endsAt);
  });

  it('rejects a session with neither a title nor a line-up', async (t) => {
    const { api, tenant, location } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'live',
      title: null,
      participantIds: [],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.title);
  });

  it('rejects a session with several people and no title', async (t) => {
    const { api, tenant, location, johnny, nova } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'live',
      title: null,
      participantIds: [johnny.id, nova.id],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.title);
  });

  it('rejects a replacement that leaves neither a title nor a line-up', async (t) => {
    const { api, tenant, location, johnny } = await setup(t);

    const session = await create.session(tenant, location, { participants: [johnny] });

    const res = await api.put(`/admin/tenants/${tenant.id}/sessions/${session.id}`, {
      locationId: location.id,
      type: 'live',
      participantIds: [],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
  });

  it('rejects the same participant twice on a line-up', async (t) => {
    const { api, tenant, location, johnny } = await setup(t);

    const res = await api.post<{ properties: Record<string, unknown> }>(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'live',
      title: 'Seeing double',
      participantIds: [johnny.id, johnny.id],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.participantIds);
  });

  it('rejects an unknown type', async (t) => {
    const { api, tenant, location } = await setup(t);

    const res = await api.post(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'concert',
      title: 'Wrong type',
      participantIds: [],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
  });
});

describe('sessions of another festival', () => {
  it('are not listed', async (t) => {
    const { api, tenant, other } = await setup(t);

    await create.session(other, await create.location(other), { title: 'Elsewhere' });

    const res = await api.get<SessionDto[]>(`/admin/tenants/${tenant.id}/sessions`);

    assert.deepEqual(res.body, []);
  });

  it('are not reachable for replacement', async (t) => {
    const { api, tenant, other, location } = await setup(t);

    const session = await create.session(other, await create.location(other), { title: 'Elsewhere' });

    const res = await api.put(`/admin/tenants/${tenant.id}/sessions/${session.id}`, {
      locationId: location.id,
      type: 'live',
      title: 'Hijacked',
      participantIds: [],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'not_found' });
  });

  it('are not reachable for deletion', async (t) => {
    const { api, tenant, other } = await setup(t);

    const session = await create.session(other, await create.location(other), { title: 'Elsewhere' });

    const res = await api.delete(`/admin/tenants/${tenant.id}/sessions/${session.id}`);

    assert.equal(res.status, 404);
  });

  it('cannot lend their location to a session', async (t) => {
    const { api, tenant, other } = await setup(t);

    const elsewhere = await create.location(other, { name: 'Elsewhere' });

    const res = await api.post(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: elsewhere.id,
      type: 'live',
      title: 'Hijacked',
      participantIds: [],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'unknown_location' });
  });

  it('cannot lend their people to a line-up', async (t) => {
    const { api, tenant, other, location } = await setup(t);

    const stranger = await create.participant(other, { name: 'Stranger' });

    const res = await api.post(`/admin/tenants/${tenant.id}/sessions`, {
      locationId: location.id,
      type: 'live',
      participantIds: [stranger.id],
      startsAt: '2026-07-01T20:00:00.000Z',
      endsAt: '2026-07-01T21:00:00.000Z',
    });

    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: 'unknown_participant' });
  });
});
