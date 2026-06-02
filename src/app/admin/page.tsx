import { format } from 'date-fns';
import { db } from 'src/database/db';

import { LinkButton } from './components/button';
import { CardLink } from './components/card';

export default async function AdminPage() {
  const festivals = await db.query.festivals.findMany({
    orderBy: { start: 'desc' },
  });

  return (
    <>
      <div className="row items-center justify-between">
        <h1 className="my-6">Festivals</h1>
        <LinkButton href="/admin/festivals/new">New festival</LinkButton>
      </div>

      {festivals.length === 0 ? (
        <p className="text-dim">No festivals yet. Create your first one.</p>
      ) : (
        <ul className="col gap-2">
          {festivals.map((festival) => (
            <li key={festival.id}>
              <CardLink
                href={`/admin/festivals/${festival.id}`}
                className="px-4 py-3 row items-center justify-between gap-4"
              >
                <div className="col">
                  <span className="font-medium">{festival.name}</span>
                  <span className="text-sm text-dim">{festival.domain ?? 'No domain set'}</span>
                </div>

                <div className="text-sm text-dim">
                  {format(festival.start, 'MMM d, yyyy')} - {format(festival.end, 'MMM d, yyyy')}
                </div>
              </CardLink>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
