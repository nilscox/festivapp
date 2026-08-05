import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';

export function initAnalytics() {
  const analyticsUrl = import.meta.env['VITE_ANALYTICS_URL'];
  const analyticsSiteId = import.meta.env['VITE_ANALYTICS_SITE_ID'];

  if (!analyticsUrl || !analyticsSiteId) {
    return;
  }

  const script = document.createElement('script');

  script.textContent = snippet(analyticsUrl, analyticsSiteId);
  document.body.appendChild(script);
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { pathname, searchStr, hash } = useLocation();

  useEffect(() => {
    trackPageView([pathname, searchStr, hash].filter(Boolean).join(''));
  }, [pathname, searchStr, hash]);

  return children;
}

export function trackEvent(category: string, action: string, { name, value }: { name?: string; value?: number } = {}) {
  paq()?.push(['trackEvent', category, action, name, value]);
}

function trackPageView(url: string) {
  paq()?.push(['setCustomUrl', url]);
  paq()?.push(['trackPageView']);
}

function paq() {
  // oxlint-disable-next-line no-underscore-dangle
  return window._paq;
}

function snippet(url: string, siteId: string) {
  return `
var _paq = window._paq = window._paq || [];

_paq.push(['enableLinkTracking']);

(function() {
  var u="${url}/";

  _paq.push(['setTrackerUrl', u+'matomo.php']);
  _paq.push(['setSiteId', '${siteId}']);

  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
  g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
})();`;
}

declare global {
  interface Window {
    _paq?: unknown[][];
  }
}
