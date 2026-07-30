import type { MeResponse } from '@festivapp/contracts';
import { sub } from 'date-fns';
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { useApi } from './helpers/api.ts';
import { createAuthSession, createOrganizer, createTenant } from './helpers/fixtures.ts';

const api = useApi();

beforeEach(() => api.clearCookies());

describe('POST /admin/auth/login', () => {
  it('signs the organizer in and returns their festivals', async () => {
    const tenant = await createTenant({ name: 'Cool Fest', domain: 'coolfest.localhost' });
    const organizer = await createOrganizer({ email: 'jane@test.local', password: 'hunter2', tenants: [tenant] });

    const res = await api.login('jane@test.local', 'hunter2');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, {
      organizer: { id: organizer.id, email: 'jane@test.local', name: null },
      tenants: [{ id: tenant.id, name: 'Cool Fest', domain: 'coolfest.localhost' }],
    });
  });

  it('sets an http-only session cookie', async () => {
    await createOrganizer({ email: 'jane@test.local', password: 'hunter2' });

    const res = await api.login('jane@test.local', 'hunter2');
    const [cookie] = res.headers['set-cookie'] ?? [];

    assert.match(String(cookie), /^token=/);
    assert.match(String(cookie), /HttpOnly/i);
    assert.match(String(cookie), /SameSite=Lax/i);
  });

  it('lowercases the email before looking the organizer up', async () => {
    await createOrganizer({ email: 'jane@test.local', password: 'hunter2' });

    const res = await api.login('JANE@Test.Local', 'hunter2');

    assert.equal(res.status, 200);
  });

  it('rejects a wrong password without setting a cookie', async () => {
    await createOrganizer({ email: 'jane@test.local', password: 'hunter2' });

    const res = await api.login('jane@test.local', 'wrong');

    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { error: 'invalid_credentials' });
    assert.equal(res.headers['set-cookie'], undefined);
  });

  it('rejects an unknown email', async () => {
    const res = await api.login('nobody@test.local', 'hunter2');

    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { error: 'invalid_credentials' });
  });

  it('responds 400 with a validation tree for a malformed body', async () => {
    const res = await api.post<{ properties: Record<string, unknown> }>('/admin/auth/login', {
      email: 'not-an-email',
      password: '',
    });

    assert.equal(res.status, 400);
    assert.ok(res.body.properties?.email);
    assert.ok(res.body.properties?.password);
  });
});

describe('GET /admin/auth/me', () => {
  it('returns the signed-in organizer', async () => {
    const tenant = await createTenant();
    const organizer = await createOrganizer({ password: 'hunter2', tenants: [tenant] });

    await api.login(organizer.email, 'hunter2');
    const res = await api.get<MeResponse>('/admin/auth/me');

    assert.equal(res.status, 200);
    assert.equal(res.body.organizer.id, organizer.id);
    assert.deepEqual(
      res.body.tenants.map(({ id }) => id),
      [tenant.id],
    );
  });

  it('responds 401 without a session cookie', async () => {
    const res = await api.get('/admin/auth/me');

    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { error: 'unauthenticated' });
  });

  it('responds 401 for an unknown token', async () => {
    const res = await api.get('/admin/auth/me', { headers: { cookie: 'token=made-up' } });

    assert.equal(res.status, 401);
  });

  it('responds 401 for an expired session', async () => {
    const organizer = await createOrganizer();
    const token = await createAuthSession(organizer, { expiresAt: new Date(sub(Date.now(), { days: 1 })) });

    const res = await api.get('/admin/auth/me', { headers: { cookie: `token=${token}` } });

    assert.equal(res.status, 401);
  });
});

describe('POST /admin/auth/logout', () => {
  it('destroys the session', async () => {
    const organizer = await createOrganizer({ password: 'hunter2' });

    await api.login(organizer.email, 'hunter2');

    const logout = await api.post('/admin/auth/logout');
    assert.equal(logout.status, 204);

    const res = await api.get('/admin/auth/me');
    assert.equal(res.status, 401);
  });

  it('makes the session token unusable even if the client keeps the cookie', async () => {
    const organizer = await createOrganizer({ password: 'hunter2' });
    const login = await api.login(organizer.email, 'hunter2');

    const cookie = String((login.headers['set-cookie'] ?? [])[0]?.split(';')[0]);
    await api.post('/admin/auth/logout');

    const res = await api.get('/admin/auth/me', { headers: { cookie } });

    assert.equal(res.status, 401);
  });
});

describe('tenant membership', () => {
  it('lets a member read the festival', async () => {
    const tenant = await createTenant({ name: 'Cool Fest' });
    const organizer = await createOrganizer({ password: 'hunter2', tenants: [tenant] });

    await api.login(organizer.email, 'hunter2');
    const res = await api.get<{ name: string }>(`/admin/tenants/${tenant.id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Cool Fest');
  });

  it('responds 403 for a festival the organizer does not belong to', async () => {
    const tenant = await createTenant();
    const other = await createTenant();
    const organizer = await createOrganizer({ password: 'hunter2', tenants: [tenant] });

    await api.login(organizer.email, 'hunter2');
    const res = await api.get(`/admin/tenants/${other.id}`);

    assert.equal(res.status, 403);
    assert.deepEqual(res.body, { error: 'forbidden' });
  });

  it('responds 401 before 403 when unauthenticated', async () => {
    const tenant = await createTenant();

    const res = await api.get(`/admin/tenants/${tenant.id}`);

    assert.equal(res.status, 401);
  });

  it('never reads the tenant from the Host header', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost' });
    const other = await createTenant({ domain: 'other.localhost', name: 'Other' });
    const organizer = await createOrganizer({ password: 'hunter2', tenants: [tenant] });

    await api.login(organizer.email, 'hunter2');
    const res = await api.get(`/admin/tenants/${other.id}`, { host: 'other.localhost' });

    assert.equal(res.status, 403);
  });
});
