import { HeaderBackLink } from 'app/components/header-back-link';
import { getFestival } from 'app/server-utils';

export default async function () {
  const festival = await getFestival();
  const mapSrc = festival.map ? `/uploads/${festival.map}` : null;

  return (
    <div className="col h-full">
      <HeaderBackLink />

      <div className="col flex-1 items-center justify-center">
        {mapSrc ? (
          <a download href={mapSrc}>
            <img src={mapSrc} className="w-full rounded-md" />
          </a>
        ) : (
          <p className="text-dim">No map available.</p>
        )}
      </div>
    </div>
  );
}
