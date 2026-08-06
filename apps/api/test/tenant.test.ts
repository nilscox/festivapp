import type { BootstrapResponse } from '@festivapp/contracts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

describe('tenant resolution', () => {
  it('resolves the tenant from the Host header', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost' });

    assert.equal(res.status, 200);
    assert.equal(res.body.tenant.id, tenant.id);
  });

  it('ignores the port in the Host header', async (t) => {
    const api = suite.api(t);

    await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'coolfest.localhost:8000' });

    assert.equal(res.status, 200);
    assert.equal(res.body.tenant.domain, 'coolfest.localhost');
  });

  it('resolves the tenant from the x-tenant-domain header', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.get<BootstrapResponse>('/bootstrap', {
      host: 'unknown.localhost',
      headers: { 'x-tenant-domain': 'coolfest.localhost' },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.tenant.id, tenant.id);
  });

  it('resolves the tenant from the __tenant query param', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.get<BootstrapResponse>('/bootstrap?__tenant=coolfest.localhost', {
      host: 'unknown.localhost',
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.tenant.id, tenant.id);
  });

  it('serves the tenant matching the host when several exist', async (t) => {
    const api = suite.api(t);

    await create.tenant({ domain: 'one.localhost', name: 'One' });
    await create.tenant({ domain: 'two.localhost', name: 'Two' });

    const res = await api.get<BootstrapResponse>('/bootstrap', { host: 'two.localhost' });

    assert.equal(res.body.tenant.name, 'Two');
  });

  it('responds 404 for an unknown host', async (t) => {
    const api = suite.api(t);

    await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.get('/bootstrap', { host: 'nope.localhost' });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'tenant_not_found', domain: 'nope.localhost' });
  });
});

describe('manifest', () => {
  it('serves a manifest built from the tenant theme', async (t) => {
    const api = suite.api(t);

    await create.tenant({
      domain: 'coolfest.localhost',
      name: 'Cool Fest',
      theme: {
        backgroundColor: '#101014',
        accentColor: '#f0f0ff',
        fonts: { display: 'sans-serif', body: 'sans-serif', mono: 'monospace' },
        logo: { wordmarkUrl: null, iconUrl: '/files/abc' },
        backgroundImage: null,
        pwa: { name: 'Cool Fest 2026', shortName: 'Cool' },
        customCss: null,
      },
    });

    const res = await api.get<Record<string, unknown>>('/manifest.webmanifest', { host: 'coolfest.localhost' });

    assert.equal(res.status, 200);
    assert.match(String(res.headers['content-type']), /application\/manifest\+json/);
    assert.equal(res.body.name, 'Cool Fest 2026');
    assert.equal(res.body.short_name, 'Cool');
    assert.equal(res.body.background_color, '#101014');
    assert.deepEqual(res.body.icons, [{ src: '/files/abc', sizes: 'any', purpose: 'any' }]);
  });

  it('falls back to the tenant name when the pwa name is unset', async (t) => {
    const api = suite.api(t);

    await create.tenant({ domain: 'coolfest.localhost', name: 'Cool Fest' });

    const res = await api.get<Record<string, unknown>>('/manifest.webmanifest', { host: 'coolfest.localhost' });

    assert.equal(res.body.name, 'Cool Fest');
    assert.equal(res.body.short_name, 'Cool Fest');
  });
});
