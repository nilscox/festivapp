import { db } from '@festivapp/persistence';
import { isValid } from 'date-fns';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';

export const getCurrentHostname = cache(async function () {
  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto');
  const host = headersList.get('host');

  return `${proto}://${host}`;
});

export const getNow = cache(async function () {
  const cookieStore = await cookies();
  const now = new Date(cookieStore.get('now')?.value ?? '');

  if (isValid(now)) {
    return now;
  }

  return new Date();
});

export const getFestival = cache(async function () {
  const headersList = await headers();
  const host = headersList.get('host');
  const subdomain = host?.split('.').at(0);

  const festival = await db.query.festivals.findFirst({
    where: { domain: subdomain },
  });

  if (!festival) {
    notFound();
  }

  return festival;
});

export const getUser = cache(async function () {
  const cookieStore = await cookies();
  const authCode = cookieStore.get('authCode');

  if (authCode) {
    return db.query.users.findFirst({ where: { authCode: authCode.value } });
  }
});

export const getSavedEvents = cache(async function () {
  const cookieStore = await cookies();
  const savedEvents: string[] = JSON.parse(cookieStore.get('savedEvents')?.value || JSON.stringify([]));

  return savedEvents;
});

export const appendQuery = (
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
  value?: string,
) => {
  const params = new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((value) => [key, value]) : [[key, value ?? '']],
    ),
  );

  if (value === undefined) {
    params.delete(key);
  } else {
    params.set(key, value);
  }

  return `?${params.toString()}`;
};
