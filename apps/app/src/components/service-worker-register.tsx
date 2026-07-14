'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const triggerPrecache = () => {
      navigator.serviceWorker.controller?.postMessage({ type: 'PRECACHE' });
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Already controlled: refresh the precache on this load.
        if (navigator.serviceWorker.controller) {
          triggerPrecache();
        }

        // First install / update: refresh once the new worker takes over.
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;

          installing?.addEventListener('statechange', () => {
            if (installing.state === 'activated') {
              triggerPrecache();
            }
          });
        });
      })
      .catch(() => {
        // ignore registration failures
      });
  }, []);

  return null;
}
