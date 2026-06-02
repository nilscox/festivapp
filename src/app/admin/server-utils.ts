'use server';

import { cache } from 'react';
import { db } from 'src/database/db';

export const getFestival = cache(async (festivalId: string) => {
  return db.query.festivals.findFirst({
    where: { id: { eq: festivalId } },
  });
});
