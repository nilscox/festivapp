import { inArray } from 'drizzle-orm';
import webpush, { WebPushError } from 'web-push';

import { config } from './config.ts';
import { db } from './db/client.ts';
import { pushSubscriptions, type PushSubscription } from './db/schema.ts';

export const pushEnabled = Boolean(config.vapidPublicKey && config.vapidPrivateKey);

if (config.vapidPublicKey && config.vapidPrivateKey) {
  webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
}

export type PushPayload = {
  title: string;
  body: string;
};

export function findSubscriptions(tenantId: string, subscriptionId?: string): Promise<PushSubscription[]> {
  return db.query.pushSubscriptions.findMany({
    where: subscriptionId ? { id: subscriptionId, tenantId } : { tenantId },
  });
}

export async function sendToTenant(tenantId: string, payload: PushPayload, subscriptionId?: string): Promise<void> {
  if (!pushEnabled) {
    return;
  }

  const rows = await findSubscriptions(tenantId, subscriptionId);

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        JSON.stringify(payload),
      );
    }),
  );

  const gone = rows.filter((_, index) => isGone(results[index])).map((row) => row.endpoint);
  const failed = results.filter((result) => result.status === 'rejected');

  if (gone.length > 0) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, gone));
  }

  console.log(`[api] notified ${tenantId}: ${rows.length - failed.length}/${rows.length} sent, ${gone.length} pruned`);

  for (const { reason } of failed) {
    console.error('[api] push failed:', reason);
  }
}

/** A push service answering 404 or 410 is the only signal we get that a device is gone. */
function isGone(result: PromiseSettledResult<void> | undefined): boolean {
  if (result?.status !== 'rejected') {
    return false;
  }

  return result.reason instanceof WebPushError && [404, 410].includes(result.reason.statusCode);
}
