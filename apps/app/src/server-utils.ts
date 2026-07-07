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

export const getSavedEventIds = cache(async function () {
  const cookieStore = await cookies();
  const rawSavedEvents = cookieStore.get('savedEvents')?.value;

  const savedEvents = new Set(rawSavedEvents?.split(';'));

  return savedEvents;
});

type SearchParams = Record<string, string | string[] | undefined>;

export const updateSearchParams = (searchParams: SearchParams, update: (search: URLSearchParams) => void): string => {
  const params = new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((value) => [key, value]) : [[key, value ?? '']],
    ),
  );

  update(params);

  return params.toString();
};

export const toggleSearchParam = (searchParams: SearchParams, name: string): string => {
  return updateSearchParams(searchParams, (params) => {
    if (params.get(name) === 'true') {
      params.delete(name);
    } else {
      params.set(name, 'true');
    }
  });
};
