import { HeaderBackLink } from 'app/components/header-back-link';
import { getFestival } from 'app/server-utils';

export default async function () {
  const festival = await getFestival();
  const map = festival.map ? `/uploads/${festival.map}` : null;

  return (
    <div className="col h-full">
      <HeaderBackLink />

      <div className="col flex-1 items-center justify-center">
        {map ? (
          <a download href={map} aria-label="Download map">
            <img alt="Map" src={map} className="w-full rounded-md" />
          </a>
        ) : (
          <p className="text-dim">No map available.</p>
        )}
      </div>
    </div>
  );
}
