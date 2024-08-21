import { useLocation } from '@solidjs/router';
import { createEffect } from 'solid-js';

export function trackPageViews() {
  const location = useLocation();
  let isInitialRender = true;
  let timeout: NodeJS.Timeout | undefined = undefined;

  createEffect(() => {
    let url = location.pathname;

    if (location.search !== '') {
      url += location.search;
    }

    if (isInitialRender) {
      isInitialRender = false;
      return;
    }

    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      _paq.push(['setCustomUrl', url]);
      _paq.push(['setDocumentTitle', document.title]);
      _paq.push(['trackPageView']);
    }, 50);
  });
}

export function trackEvent(category: string, action: string, name?: string) {
  _paq.push(['trackEvent', category, action, ...(name ? [name] : [])]);
}
