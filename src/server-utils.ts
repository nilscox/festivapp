import { isValid } from 'date-fns';
import { cookies, headers } from 'next/headers';
import { cache } from 'react';

import notFound from './app/not-found';
import { db } from './database/db';

export async function getNow() {
  const cookieStore = await cookies();
  const now = new Date(cookieStore.get('now')?.value ?? '');

  if (isValid(now)) {
    return now;
  }

  return new Date();
}

export async function getCurrentHostname() {
  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto');
  const host = headersList.get('host');

  return `${proto}://${host}`;
}

export const getFestival = cache(async function () {
  const cookieStore = await cookies();
  const festivalId = cookieStore.get('festivalId');

  const festival = await db.query.festivals.findFirst({ where: { id: { eq: festivalId?.value } } });

  if (!festival) {
    throw notFound();
  }

  return festival;
});

export const getUser = cache(async function () {
  const cookieStore = await cookies();
  const authCode = cookieStore.get('authCode');

  if (authCode) {
    return db.query.users.findFirst({ where: { authCode: { eq: authCode.value } } });
  }
});
