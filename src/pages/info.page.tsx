import { useIntl } from '@cookbook/solid-intl';

import { data } from 'src/data';
import { usePageTitle } from 'src/utils/page-title';

export function Info() {
  const intl = useIntl();

  usePageTitle(() => intl.formatMessage({ id: 'info.title' }));

  // eslint-disable-next-line solid/no-innerhtml
  return <div innerHTML={data.info} />;
}
