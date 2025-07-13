import { useIntl } from '@cookbook/solid-intl';

import { DocumentTitle } from 'src/components/document-title';
import { data } from 'src/data';

export function Map() {
  const intl = useIntl();

  return (
    <div class="col flex-1 justify-center">
      <DocumentTitle title={intl.formatMessage({ id: 'map.title' })} />

      <a download="" href={data.map}>
        <img src={data.map} class="w-full rounded-lg" />
      </a>
    </div>
  );
}
