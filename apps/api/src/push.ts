import { assert, get } from '@festivapp/utils';
import { inArray } from 'drizzle-orm';
import webpush, { WebPushError } from 'web-push';

import { pushSubscriptions, type PushSubscription } from './db/schema.ts';

import type { Config } from './config.ts';
import type { Database } from './db/client.ts';
import type { Logger } from './logger.ts';

export interface Push {
  enabled: boolean;
  findSubscriptions(tenantId: string, subscriptionId?: string): Promise<PushSubscription[]>;
  sendToTenant(tenantId: string, payload: PushPayload, subscriptionId?: string): Promise<void>;
}

export type PushPayload = {
  title: string;
  body: string;
};

export function createPush({ config, db, logger }: { config: Config; db: Database; logger: Logger }): Push {
  const enabled = Boolean(config.vapidPublicKey && config.vapidPrivateKey);

  if (enabled) {
    assert(config.vapidPublicKey && config.vapidPrivateKey);
    webpush.setVapidDetails(config.vapidSubject, config.vapidPublicKey, config.vapidPrivateKey);
  }

  return {
    enabled,
    findSubscriptions,
    sendToTenant,
  };

  function findSubscriptions(tenantId: string, subscriptionId?: string) {
    return db.query.pushSubscriptions.findMany({
      where: subscriptionId ? { id: subscriptionId, tenantId } : { tenantId },
    });
  }

  async function sendToTenant(tenantId: string, payload: PushPayload, subscriptionId?: string) {
    if (!enabled) {
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

    const gone = rows.filter((_, index) => isGone(results[index])).map(get('endpoint'));
    const failed = results.filter((result) => result.status === 'rejected');

    if (gone.length > 0) {
      await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.endpoint, gone));
    }

    logger.info('notification sent', {
      tenantId,
      devices: rows.length,
      sent: rows.length - failed.length,
      pruned: gone.length,
    });

    for (const { reason } of failed) {
      const error = reason instanceof Error ? reason : new Error(String(reason));

      logger.error('push failed', {
        tenantId,
        error,
      });
    }
  }
}

/** A push service answering 404 or 410 is the only signal we get that a device is gone. */
function isGone(result: PromiseSettledResult<void> | undefined): boolean {
  if (result?.status !== 'rejected') {
    return false;
  }

  return result.reason instanceof WebPushError && [404, 410].includes(result.reason.statusCode);
}
