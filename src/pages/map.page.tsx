import { useIntl } from '@cookbook/solid-intl';

import { data } from 'src/data';
import { usePageTitle } from 'src/utils/page-title';

export function Map() {
  const intl = useIntl();

  usePageTitle(() => intl.formatMessage({ id: 'map.title' }));

  return (
    <div class="col flex-1 justify-center">
      <a download="" href={data.map}>
        <img src={data.map} class="w-full rounded-lg" />
      </a>
    </div>
  );
}
