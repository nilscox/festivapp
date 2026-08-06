import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import webpush, { WebPushError } from 'web-push';

import { TestSuite } from './helpers/api.ts';
import { fixtures } from './helpers/fixtures.ts';
import { stubPush } from './helpers/push.ts';

const vapid = webpush.generateVAPIDKeys();

const withVapid = {
  vapidPublicKey: vapid.publicKey,
  vapidPrivateKey: vapid.privateKey,
  vapidSubject: 'mailto:test',
};

const suite = TestSuite.create();
const create = fixtures(suite.db);

const subscription = {
  endpoint: 'https://push.test.local/device',
  keys: { p256dh: 'p256dh', auth: 'auth' },
};

const payload = { title: 'Gates open', body: 'The site is open.' };

describe('POST /push/subscriptions', () => {
  it('registers a device', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.post('/push/subscriptions', subscription, { host: tenant.domain });

    assert.equal(res.status, 204);

    const rows = await suite.db.query.pushSubscriptions.findMany();

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.tenantId, tenant.id);
    assert.equal(rows[0]?.endpoint, subscription.endpoint);
  });

  it('refuses to register a device when the deployment has no VAPID keys', async (t) => {
    const api = suite.api(t);
    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.post('/push/subscriptions', subscription, { host: tenant.domain });

    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { error: 'push_disabled' });
  });

  it('resolves the tenant from the host', async (t) => {
    const api = suite.api(t, { config: withVapid });

    const res = await api.post('/push/subscriptions', subscription, { host: 'nowhere.localhost' });

    assert.equal(res.status, 404);
  });
});

describe('DELETE /push/subscriptions', () => {
  it('unregisters a device', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant({ domain: 'coolfest.localhost' });
    const registered = await create.pushSubscription(tenant);

    const res = await api.delete('/push/subscriptions', { endpoint: registered.endpoint }, { host: tenant.domain });

    assert.equal(res.status, 204);
    assert.deepEqual(await suite.db.query.pushSubscriptions.findMany(), []);
  });

  it('rejects an invalid body', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant({ domain: 'coolfest.localhost' });

    const res = await api.delete('/push/subscriptions', { endpoint: 'not-a-url' }, { host: tenant.domain });

    assert.equal(res.status, 400);
  });
});

describe('sendToTenant', () => {
  it('notifies every device of the festival', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant();
    const first = await create.pushSubscription(tenant);
    const second = await create.pushSubscription(tenant);
    const send = stubSend(t);

    await api.push.sendToTenant(tenant.id, payload);

    assert.deepEqual(sentTo(send), [first.endpoint, second.endpoint]);
    assert.equal(send.mock.calls[0]?.arguments[1], JSON.stringify(payload));
  });

  it('leaves the devices of another festival alone', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant();
    const other = await create.tenant();
    const registered = await create.pushSubscription(tenant);

    await create.pushSubscription(other);

    const send = stubSend(t);

    await api.push.sendToTenant(tenant.id, payload);

    assert.deepEqual(sentTo(send), [registered.endpoint]);
  });

  it('sends to a single device when given a subscription id', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant();
    const registered = await create.pushSubscription(tenant);

    await create.pushSubscription(tenant);

    const send = stubSend(t);

    await api.push.sendToTenant(tenant.id, payload, registered.id);

    assert.deepEqual(sentTo(send), [registered.endpoint]);
  });

  for (const statusCode of [404, 410]) {
    it(`prunes a device whose push service answers ${statusCode}`, async (t) => {
      const api = suite.api(t, { config: withVapid });
      const tenant = await create.tenant();
      const gone = await create.pushSubscription(tenant);
      const alive = await create.pushSubscription(tenant);

      stubSend(t, (endpoint) => {
        if (endpoint === gone.endpoint) {
          throw new WebPushError('gone', statusCode, {}, '', endpoint);
        }
      });

      await api.push.sendToTenant(tenant.id, payload);

      const rows = await suite.db.query.pushSubscriptions.findMany();

      assert.deepEqual(
        rows.map((row) => row.endpoint),
        [alive.endpoint],
      );
    });
  }

  it('keeps a device that failed for any other reason', async (t) => {
    const api = suite.api(t, { config: withVapid });
    const tenant = await create.tenant();
    const registered = await create.pushSubscription(tenant);

    stubSend(t, () => {
      throw new WebPushError('boom', 500, {}, '', registered.endpoint);
    });

    await api.push.sendToTenant(tenant.id, payload);

    const rows = await suite.db.query.pushSubscriptions.findMany();

    assert.deepEqual(
      rows.map((row) => row.endpoint),
      [registered.endpoint],
    );
  });
});

describe('publishing a message', () => {
  it('notifies the festival when asked to', async (t) => {
    const push = stubPush();
    const api = suite.api(t, { push });
    const tenant = await create.tenant();
    const organizer = await create.organizer({ tenants: [tenant] });

    await api.login(organizer.email, organizer.password);

    const res = await api.post(`/admin/tenants/${tenant.id}/messages`, {
      title: payload.title,
      body: payload.body,
      notify: true,
    });

    assert.equal(res.status, 201);

    /** The route answers before sending, so the notification lands after the response. */
    await waitFor(() => push.sent.length === 1);

    assert.deepEqual(push.sent, [{ tenantId: tenant.id, payload, subscriptionId: undefined }]);
  });

  it('stays quiet when not asked to', async (t) => {
    const push = stubPush();
    const api = suite.api(t, { push });
    const tenant = await create.tenant();
    const organizer = await create.organizer({ tenants: [tenant] });

    await api.login(organizer.email, organizer.password);

    const res = await api.post(`/admin/tenants/${tenant.id}/messages`, {
      title: payload.title,
      body: payload.body,
    });

    assert.equal(res.status, 201);
    assert.deepEqual(push.sent, []);
  });
});

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
