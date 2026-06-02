import { CardLink } from 'src/app/admin/components/card';
import { Image } from 'src/app/admin/components/image';
import { db } from 'src/database/db';

import { SearchInput } from './artist/search-input';

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
            <CardLink href={`/admin/festivals/${festivalId}/people/artist/${artist.id}`} className="row gap-2">
              <Image src={artist.image} className="size-20 object-cover" />
              <div className="p-2 col gap-1">
                <div className="text-lg font-medium">{artist.name}</div>
                <div className="text-dim">{artist.styles.join(' / ')}</div>
              </div>
            </CardLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
