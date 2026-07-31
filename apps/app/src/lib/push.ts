import { defined } from '@festivapp/utils';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { useOnline } from '../hooks/use-online.ts';
import { usePushPublicKey } from './bootstrap.ts';

type PushState = {
  permission: NotificationPermission;
  subscribed: boolean;
};

const listeners = new Set<() => void>();

let state: PushState = {
  permission: canPush() ? Notification.permission : 'denied',
  subscribed: false,
};

export function usePushSubscription() {
  const publicKey = usePushPublicKey();
  const online = useOnline();

  const supported = [canPush(), publicKey, online].every(Boolean);

  const { permission, subscribed } = useSyncExternalStore(subscribe, getState);

  useEffect(() => {
    if (supported) {
      void currentSubscription().then((subscription) => setState({ subscribed: subscription !== null }));
    }
  }, [supported]);

  const enable = useCallback(async () => {
    const permission = await Notification.requestPermission();

    setState({ permission });

    if (permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeKey(defined(publicKey)),
    });

    const { endpoint, keys } = subscription.toJSON();

    const response = await fetch('/api/push/subscriptions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint, keys }),
    });

    if (!response.ok) {
      await subscription.unsubscribe();
      console.log(await response.text());
      throw new Error(`Push subscription failed: ${response.status}`);
    }

    setState({ subscribed: true });
  }, [publicKey]);

  const disable = useCallback(async () => {
    const subscription = await currentSubscription();

    setState({ subscribed: false });

    if (subscription === null) {
      return;
    }

    await fetch('/api/push/subscriptions', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    await subscription.unsubscribe();
  }, []);

  return { supported, permission, subscribed, enable, disable };
}

function canPush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

function getState(): PushState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function setState(values: Partial<PushState>): void {
  state = { ...state, ...values };

  for (const listener of listeners) {
    listener();
  }
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;

  return registration.pushManager.getSubscription();
}

function decodeKey(key: string): Uint8Array<ArrayBuffer> {
  const padded = key.padEnd(key.length + ((4 - (key.length % 4)) % 4), '=');
  const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
