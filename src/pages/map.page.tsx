import { useIntl } from '@cookbook/solid-intl';

import { DocumentTitle } from '../components/document-title';
import { data } from '../data';

export function MapPage() {
  const intl = useIntl();

  return (
    <div class="col h-full items-center justify-center">
      <DocumentTitle title={intl.formatMessage({ id: 'navigation.map' })} />

      <a download href={data.map} class="max-h-full">
        <img src={data.map} class="max-h-full" />
      </a>
    </div>
  );
}
