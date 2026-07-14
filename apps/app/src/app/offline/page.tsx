import { Trans } from '@lingui/react/macro';
import { WifiOffIcon } from 'lucide-react';

import { configureI18n } from '@/i18n/i18n';

export default async function () {
  await configureI18n();

  return (
    <div className="col h-full items-center justify-center gap-4 text-center">
      <WifiOffIcon className="size-12 text-dim" />

      <div>
        <h1>
          <Trans>You're offline</Trans>
        </h1>

        <p className="text-dim">
          <Trans>This page isn't available offline yet. Reconnect to load it.</Trans>
        </p>
      </div>
    </div>
  );
}
