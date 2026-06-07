import { getFestival } from '@/server-utils';

export default async function () {
  const festival = await getFestival();
  const map = festival.map ? `/uploads/${festival.map}` : null;

  return (
    <div className="col h-full items-center justify-center">
      {map ? (
        <a download href={map} aria-label="Download map">
          <img alt="Map" src={map} className="w-full rounded-md" />
        </a>
      ) : (
        <p className="text-dim">No map available.</p>
      )}
    </div>
  );
}
