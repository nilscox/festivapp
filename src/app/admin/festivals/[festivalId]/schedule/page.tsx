import { db } from 'src/database/db';

export default async function AdminSchedulePage({ params }: PageProps<'/admin/festivals/[festivalId]/schedule'>) {
  const { festivalId } = await params;

  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festivalId } },
    orderBy: { sortOrder: 'asc' },
  });

  return (
    <>
      {locations.map((location) => (
        <div key={location.id}>{location.label}</div>
      ))}
    </>
  );
}
