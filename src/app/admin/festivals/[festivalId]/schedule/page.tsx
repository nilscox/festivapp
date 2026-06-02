import { db } from 'src/database/db';

import { LocationSection } from './location-section';

export default async function AdminSchedulePage({ params }: PageProps<'/admin/festivals/[festivalId]/schedule'>) {
  const { festivalId } = await params;

  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festivalId } },
    orderBy: { sortOrder: 'asc' },
  });

  const allArtists = await db.query.artists.findMany({
    where: { festivalId: { eq: festivalId } },
    orderBy: { name: 'asc' },
  });

  const allEvents = await db.query.events.findMany({
    where: { festivalId: { eq: festivalId } },
    with: { artists: true },
    orderBy: { start: 'asc' },
  });

  return (
    <>
      <h2 className="mb-6">Manage Schedule</h2>

      {locations.length === 0 ? (
        <p className="text-dim">No locations yet. Create locations first.</p>
      ) : (
        <div className="col gap-4">
          {locations.map((location) => {
            const locationEvents = allEvents.filter((e) => e.locationId === location.id);

            return (
              <LocationSection
                key={location.id}
                location={location}
                events={locationEvents}
                allArtists={allArtists}
                festivalId={festivalId}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
