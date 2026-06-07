'use server';

import { db } from '@festivapp/persistence';
import { cache } from 'react';

export const getFestival = cache(async (festivalId: string) => {
  return db.query.festivals.findFirst({
    where: { id: { eq: festivalId } },
  });
});
