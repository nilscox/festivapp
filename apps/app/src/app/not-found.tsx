import { Trans } from '@lingui/react/macro';

import { configureI18n } from '@/i18n/i18n';

export default async function () {
  await configureI18n();

  return (
    <div className="background-text col h-full items-center justify-center text-3xl font-semibold">
      <Trans>404 - Not found.</Trans>
    </div>
  );
}
