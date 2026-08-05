import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { container } from '../src/container.ts';
import { useApi } from './helpers/api.ts';
import { createPushSubscription, createTenant } from './helpers/fixtures.ts';

const api = useApi();

const subscription = {
  endpoint: 'https://push.test.local/device',
  keys: { p256dh: 'p256dh', auth: 'auth' },
};

describe('POST /push/subscriptions', () => {
  it('refuses to register a device when the deployment has no VAPID keys', async () => {
    await createTenant({ domain: 'coolfest.localhost' });

    const res = await api.post('/push/subscriptions', subscription, { host: 'coolfest.localhost' });

    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { error: 'push_disabled' });
  });

  it('resolves the tenant from the host', async () => {
    const res = await api.post('/push/subscriptions', subscription, { host: 'nowhere.localhost' });

    assert.equal(res.status, 404);
  });
});

describe('DELETE /push/subscriptions', () => {
  it('unregisters a device', async () => {
    const db = container.resolve('db');
    const tenant = await createTenant({ domain: 'coolfest.localhost' });
    const registered = await createPushSubscription(tenant);

    const res = await api.delete('/push/subscriptions', { endpoint: registered.endpoint }, { host: tenant.domain });

    assert.equal(res.status, 204);
    assert.deepEqual(await db.query.pushSubscriptions.findMany(), []);
  });

  it('rejects an invalid body', async () => {
    const tenant = await createTenant({ domain: 'coolfest.localhost' });

    const res = await api.delete('/push/subscriptions', { endpoint: 'not-a-url' }, { host: tenant.domain });

    assert.equal(res.status, 400);
  });
});
