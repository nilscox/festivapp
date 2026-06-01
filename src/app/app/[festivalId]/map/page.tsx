import { HeaderBackLink } from 'src/components/header-back-link';
import { getFestival } from 'src/server-utils';

export default async function () {
  const festival = await getFestival();

  return (
    <div className="col h-full">
      <HeaderBackLink />

      <div className="col flex-1 items-center justify-center">
        <a download href={festival.map}>
          <img src={festival.map} className="w-full rounded-md" />
        </a>
      </div>
    </div>
  );
}
