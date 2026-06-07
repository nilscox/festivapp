import { type NextRequest, NextResponse } from 'next/server';

import { getPreferredLocale } from './i18n/i18n';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getPreferredLocale(request.headers.get('accept-language'));
  const url = request.nextUrl.clone();

  url.pathname = `/${locale}${pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/'],
};
