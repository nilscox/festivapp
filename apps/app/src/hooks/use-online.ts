import { useSyncExternalStore } from 'react';

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot);
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('online', listener);
  window.addEventListener('offline', listener);

  return () => {
    window.removeEventListener('online', listener);
    window.removeEventListener('offline', listener);
  };
}
