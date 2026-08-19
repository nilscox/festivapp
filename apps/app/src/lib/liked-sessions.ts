import { useSyncExternalStore } from 'react';

const storageKey = 'festivapp:liked-sessions';

const listeners = new Set<() => void>();

let state: { ids: string[] } = { ids: readStorage() };

window.addEventListener('storage', (event) => {
  if (event.key === storageKey || event.key === null) {
    state = { ids: readStorage() };
    notify();
  }
});

export function useLikedSessions() {
  const { ids } = useSyncExternalStore(subscribe, getState);

  return {
    ids,
    toggle(sessionId: string) {
      const current = getState().ids;

      setState({
        ids: current.includes(sessionId) ? current.filter((id) => id !== sessionId) : [...current, sessionId],
      });
    },
  };
}

function readStorage(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');

    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    window.alert('Failed to load liked session');
    localStorage.setItem(`${storageKey}:${Date.now()}`, localStorage.getItem(storageKey) ?? '');

    return [];
  }
}

function writeStorage(ids: string[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {}
}

function getState() {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

function setState(values: Partial<typeof state>): void {
  state = { ...state, ...values };

  writeStorage(state.ids);
  notify();
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}
