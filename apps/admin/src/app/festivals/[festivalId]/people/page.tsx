import { db } from '@festivapp/persistence';
import { Collapsible } from 'radix-ui';

import { Card } from '@/components/card';
import { Image } from '@/components/image';

import { SearchInput } from '../../../../components/search-input';
import { ArtistForm } from './artist-form';

export default async function AdminArtistsPage({ params, searchParams }: PageProps<'/festivals/[festivalId]/people'>) {
  const { festivalId } = await params;
  const { search } = await searchParams;

  const artists = await db.query.artists.findMany({
    where: {
      festivalId: { eq: festivalId },
      name: typeof search === 'string' ? { ilike: `%${search}%` } : undefined,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="col gap-4">
      <SearchInput />

      <ul className="col gap-2">
        {artists.map((artist) => (
          <li key={artist.id}>
            <Card asChild>
              <Collapsible.Root>
                <Collapsible.Trigger className="row w-full cursor-pointer gap-2 rounded-t-lg text-start transition-colors hover:bg-gray-100 data-[state=closed]:rounded-b-lg">
                  <Image
                    src={artist.image}
                    className="size-20 rounded-tl-lg object-cover in-data-[state=closed]:rounded-bl-lg"
                  />
                  <div className="col gap-1 p-2">
                    <div className="text-lg font-medium">{artist.name}</div>
                    <div className="text-sm text-dim">{artist.styles.join(' / ')}</div>
                  </div>
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <div className="border-t p-4">
                    <ArtistForm artist={artist} />
                  </div>
                </Collapsible.Content>
              </Collapsible.Root>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
