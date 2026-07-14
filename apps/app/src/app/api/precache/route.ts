import { db } from '@festivapp/persistence';

import { getFestival } from '@/server-utils';

export const dynamic = 'force-dynamic';

// Pages the service worker keeps available offline. Computed per festival since
// the timetable location filters depend on the festival's locations.
export async function GET() {
  const festival = await getFestival();

  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festival.id } },
    orderBy: { sortOrder: 'asc' },
  });

  const urls = [
    '/',
    '/offline', // fallback shown by the SW for pages not in cache
    '/map',
    '/timetables',
    '/timetables?savedOnly=true',
    ...locations.map((location) => `/timetables?location=${location.id}`),
  ];

  // Images referenced on every page (background) or a dedicated page (map).
  for (const image of [festival.backgroundImage, festival.map]) {
    if (image) {
      urls.push(`/uploads/${image}`);
    }
  }

  return Response.json({ urls }, { headers: { 'Cache-Control': 'no-store' } });
}
