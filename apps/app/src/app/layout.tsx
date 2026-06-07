import { Festival } from '@festivapp/persistence';
import clsx from 'clsx';
import { Open_Sans } from 'next/font/google';

import { configureI18n } from '@/i18n/i18n';
import { LinguiClientProvider } from '@/i18n/lingui-client-provider';
import { getFestival } from '@/server-utils';

import { Navigation } from './layout/navigation';
import './styles.css';

const openSans = Open_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

function themeStyles(festival: Festival) {
  return `
    :root {
      --color-primary: ${festival.primaryColor};
      --color-accent: ${festival.accentColor};
    }

    body {
      background-image: ${festival.backgroundImage ? `url(/uploads/${festival.backgroundImage})` : 'none'};
    }
  `;
}

export default async function ({ children }: LayoutProps<'/'>) {
  const i18n = await configureI18n();

  const festival = await getFestival();

  return (
    <html lang="en" className={clsx(openSans.variable)}>
      <head>
        <style>{themeStyles(festival)}</style>
        <style>{festival.globalStyles}</style>
      </head>

      <body>
        <LinguiClientProvider initialLocale={i18n.locale} initialMessages={i18n.messages}>
          <div className="mx-auto col h-full max-w-4xl">
            <div className="flex-1 px-3 pb-16">{children}</div>
            <Navigation />
          </div>
        </LinguiClientProvider>
      </body>
    </html>
  );
}
