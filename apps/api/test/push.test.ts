import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import webpush, { WebPushError } from 'web-push';

import { container } from '../src/container.ts';
import { registerTestDependencies, useApi } from './helpers/api.ts';
import { createOrganizer, createPushSubscription, createTenant } from './helpers/fixtures.ts';

const vapid = webpush.generateVAPIDKeys();

const api = useApi({ vapidPublicKey: vapid.publicKey, vapidPrivateKey: vapid.privateKey });

const subscription = {
  endpoint: 'https://push.test.local/device',
  keys: { p256dh: 'p256dh', auth: 'auth' },
};

const payload = { title: 'Gates open', body: 'The site is open.' };

describe('POST /push/subscriptions', () => {
  it('registers a device', async () => {
    const db = container.resolve('db');
    const tenant = await createTenant({ domain: 'coolfest.localhost' });

    const res = await api.post('/push/subscriptions', subscription, { host: tenant.domain });

    assert.equal(res.status, 204);

    const rows = await db.query.pushSubscriptions.findMany();

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.tenantId, tenant.id);
    assert.equal(rows[0]?.endpoint, subscription.endpoint);
  });

  it('refuses to register a device when the deployment has no VAPID keys', async () => {
    registerTestDependencies({ vapidPublicKey: undefined, vapidPrivateKey: undefined });

    const tenant = await createTenant({ domain: 'coolfest.localhost' });

    const res = await api.post('/push/subscriptions', subscription, { host: tenant.domain });

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

describe('sendToTenant', () => {
  it('notifies every device of the festival', async (t) => {
    const tenant = await createTenant();
    const first = await createPushSubscription(tenant);
    const second = await createPushSubscription(tenant);
    const send = stubSend(t);

    await resolvePush().sendToTenant(tenant.id, payload);

    assert.deepEqual(sentTo(send), [first.endpoint, second.endpoint]);
    assert.equal(send.mock.calls[0]?.arguments[1], JSON.stringify(payload));
  });

  it('leaves the devices of another festival alone', async (t) => {
    const tenant = await createTenant();
    const other = await createTenant();
    const registered = await createPushSubscription(tenant);

    await createPushSubscription(other);

    const send = stubSend(t);

    await resolvePush().sendToTenant(tenant.id, payload);

    assert.deepEqual(sentTo(send), [registered.endpoint]);
  });

  it('sends to a single device when given a subscription id', async (t) => {
    const tenant = await createTenant();
    const registered = await createPushSubscription(tenant);

    await createPushSubscription(tenant);

    const send = stubSend(t);

    await resolvePush().sendToTenant(tenant.id, payload, registered.id);

    assert.deepEqual(sentTo(send), [registered.endpoint]);
  });

  for (const statusCode of [404, 410]) {
    it(`prunes a device whose push service answers ${statusCode}`, async (t) => {
      const db = container.resolve('db');
      const tenant = await createTenant();
      const gone = await createPushSubscription(tenant);
      const alive = await createPushSubscription(tenant);

      stubSend(t, (endpoint) => {
        if (endpoint === gone.endpoint) {
          throw new WebPushError('gone', statusCode, {}, '', endpoint);
        }
      });

      await resolvePush().sendToTenant(tenant.id, payload);

      const rows = await db.query.pushSubscriptions.findMany();

      assert.deepEqual(
        rows.map((row) => row.endpoint),
        [alive.endpoint],
      );
    });
  }

  it('keeps a device that failed for any other reason', async (t) => {
    const db = container.resolve('db');
    const tenant = await createTenant();
    const registered = await createPushSubscription(tenant);

    stubSend(t, () => {
      throw new WebPushError('boom', 500, {}, '', registered.endpoint);
    });

    await resolvePush().sendToTenant(tenant.id, payload);

    const rows = await db.query.pushSubscriptions.findMany();

    assert.deepEqual(
      rows.map((row) => row.endpoint),
      [registered.endpoint],
    );
  });
});

describe('publishing a message', () => {
  it('notifies the festival when asked to', async (t) => {
    const tenant = await createTenant();

    await createPushSubscription(tenant);

    const organizer = await createOrganizer({ tenants: [tenant] });
    const send = stubSend(t);

    await api.login(organizer.email, organizer.password);

    const res = await api.post(`/admin/tenants/${tenant.id}/messages`, {
      title: payload.title,
      body: payload.body,
      notify: true,
    });

    assert.equal(res.status, 201);

    /** The route answers before sending, so the notification lands after the response. */
    await waitFor(() => send.mock.callCount() === 1);

    assert.equal(send.mock.calls[0]?.arguments[1], JSON.stringify(payload));
  });

  it('stays quiet when not asked to', async (t) => {
    const tenant = await createTenant();

    await createPushSubscription(tenant);

    const organizer = await createOrganizer({ tenants: [tenant] });
    const send = stubSend(t);

    await api.login(organizer.email, organizer.password);

    const res = await api.post(`/admin/tenants/${tenant.id}/messages`, {
      title: payload.title,
      body: payload.body,
    });

    assert.equal(res.status, 201);
    assert.equal(send.mock.callCount(), 0);
  });
});

/** Push is scoped, so a fresh scope is what a request gets — and what reflects the current config. */
function resolvePush() {
  return container.createScope().resolve('push');
}

function stubSend(t: TestContext, onSend?: (endpoint: string) => void) {
  return t.mock.method(webpush, 'sendNotification', async (target: { endpoint: string }) => {
    onSend?.(target.endpoint);

    return { statusCode: 201, body: '', headers: {} };
  });
}

function sentTo(send: ReturnType<typeof stubSend>) {
  return send.mock.calls.map((call) => call.arguments[0]?.endpoint);
}

async function waitFor(predicate: () => boolean, timeout = 2000) {
  const deadline = Date.now() + timeout;

  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'timed out waiting for the notification to be sent');

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
