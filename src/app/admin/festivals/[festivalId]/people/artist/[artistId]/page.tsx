import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from 'src/database/db';

import { ArtistForm } from './artist-form';

export default async function AdminArtistsPage({
  params,
}: PageProps<'/admin/festivals/[festivalId]/people/artist/[artistId]'>) {
  const { festivalId, artistId } = await params;

  const artist = await db.query.artists.findFirst({
    where: { id: { eq: artistId } },
  });

  if (!artist) {
    notFound();
  }

  return (
    <>
      <header>
        <Link href={`/admin/festivals/${festivalId}/people`} className="row gap-2 items-center max-w-fit">
          <ArrowLeftIcon className="size-4" />
          Back
        </Link>
      </header>

      <h2 className="my-4">{artist.name}</h2>

      <ArtistForm artist={artist} />
    </>
  );
}
