import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';

const suite = TestSuite.create();
const create = fixtures(suite.db);

describe('unhandled errors', () => {
  it('answers 500 without leaking the cause, and logs it', async (t) => {
    const api = suite.api(t);
    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    t.mock.method(suite.db.query.locations, 'findMany', () => Promise.reject(new Error('boom')));

    const res = await api.get('/bootstrap', { host: tenant.domain });

    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { error: 'internal_server_error', message: 'Internal server error.' });

    assert.ok(api.logger.lines.some((line) => line.level === 'error' && line.message === 'unhandled error'));
  });
});
