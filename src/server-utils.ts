import { isValid } from 'date-fns';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';

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

const getRequestContextCache = cache(() => new Map<string, string>());
export const setRequestContext = (key: string, value: string) => getRequestContextCache().set(key, value);
export const getRequestContext = (key: string) => getRequestContextCache().get(key);

export const getFestival = cache(async function () {
  const festivalId = getRequestContext('festivalId');
  const festival = await db.query.festivals.findFirst({ where: { id: { eq: festivalId } } });

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
