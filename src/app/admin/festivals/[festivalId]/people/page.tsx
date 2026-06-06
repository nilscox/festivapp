import { Card } from 'admin/components/card';
import { Image } from 'admin/components/image';
import { Collapsible } from 'radix-ui';
import { db } from 'src/database/db';

import { SearchInput } from '../../../components/search-input';
import { ArtistForm } from './artist-form';

export default async function AdminArtistsPage({
  params,
  searchParams,
}: PageProps<'/admin/festivals/[festivalId]/people'>) {
  const { festivalId } = await params;
  const { search } = await searchParams;

  const artists = await db.query.artists.findMany({
    where: { festivalId: { eq: festivalId }, name: search ? { ilike: `%${search}%` } : undefined },
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
                <Collapsible.Trigger className="row gap-2 text-start w-full cursor-pointer hover:bg-gray-100 transition-colors rounded-t-lg data-[state=closed]:rounded-b-lg">
                  <Image
                    src={artist.image}
                    className="size-20 object-cover rounded-tl-lg in-data-[state=closed]:rounded-bl-lg"
                  />
                  <div className="p-2 col gap-1">
                    <div className="text-lg font-medium">{artist.name}</div>
                    <div className="text-dim text-sm">{artist.styles.join(' / ')}</div>
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
