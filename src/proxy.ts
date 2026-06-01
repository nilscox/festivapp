import { type NextRequest, NextResponse } from 'next/server';
import { isString } from 'remeda';

import { db } from './database/db';
import { assert } from './utils';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const domain = request.headers.get('host');

  assert(isString(domain));

  const festival = await db.query.festivals.findFirst({
    where: { domain: { eq: domain } },
  });

  if (festival) {
    return NextResponse.rewrite(new URL(`/app/${festival.id}${pathname}${search}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/events/:eventId', '/timetables', '/map', '/social'],
};
