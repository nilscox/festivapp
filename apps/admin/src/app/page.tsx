import { db } from '@festivapp/persistence';
import { format } from 'date-fns';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '../components/button';
import { CardLink } from '../components/card';

export default async function AdminPage() {
  const festivals = await db.query.festivals.findMany({
    orderBy: { start: 'desc' },
  });

  return (
    <>
      <div className="row items-center justify-between">
        <h1 className="my-6">Festivals</h1>
        <Button asChild left={<PlusIcon className="size-4" />}>
          <Link href="/festivals/new">New festival</Link>
        </Button>
      </div>

      {festivals.length === 0 ? (
        <p className="text-dim">No festivals yet. Create your first one.</p>
      ) : (
        <ul className="col gap-2">
          {festivals.map((festival) => (
            <li key={festival.id}>
              <CardLink href={`/festivals/${festival.id}`} className="row items-center justify-between gap-4 px-4 py-3">
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
