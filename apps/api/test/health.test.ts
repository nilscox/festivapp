import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

describe('GET /health', () => {
  it('reports ok when the database answers', async (t) => {
    const api = suite.api(t);

    const res = await api.get('/health');

    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  it('reports degraded when the database does not answer', async (t) => {
    const api = suite.api(t);

    t.mock.method(suite.db, 'execute', () => Promise.reject(new Error('connection refused')));

    const res = await api.get('/health');

    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { status: 'degraded' });
  });

  it('responds 404 with an error code for an unknown route', async (t) => {
    const api = suite.api(t);

    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.get('/nope', { host: tenant.domain });

    assert.equal(res.status, 404);
    assert.deepEqual(res.body, { error: 'not_found' });
  });
});
