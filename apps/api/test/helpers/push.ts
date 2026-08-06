import type { Push, PushPayload } from '../../src/push.ts';

export type SentNotification = {
  tenantId: string;
  payload: PushPayload;
  subscriptionId?: string;
};

export type StubPush = Push & {
  sent: SentNotification[];
};

export function stubPush({ enabled = true }: { enabled?: boolean } = {}): StubPush {
  const sent: SentNotification[] = [];

  return {
    enabled,
    sent,
    findSubscriptions: () => Promise.resolve([]),
    sendToTenant: (tenantId, payload, subscriptionId) => {
      sent.push({ tenantId, payload, subscriptionId });

      return Promise.resolve();
    },
  };
}
