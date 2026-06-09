'use server';

import { db } from '@festivapp/persistence';
import { cookies } from 'next/headers';
import { unauthorized } from 'next/navigation';
import { cache } from 'react';

export const getFestival = cache(async (festivalId: string) => {
  return db.query.festivals.findFirst({
    where: { id: { eq: festivalId } },
  });
});

export const getAuthUser = cache(async function () {
  const cookieStore = await cookies();

  if (!cookieStore.has('token')) {
    unauthorized();
  }

  const token = await db.query.authTokens.findFirst({
    where: { value: { eq: cookieStore.get('token')?.value } },
    with: { admin: true },
  });

  if (!token) {
    unauthorized();
  }

  return token.admin;
});
