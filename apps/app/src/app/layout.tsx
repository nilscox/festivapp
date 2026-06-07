import { Festival } from '@festivapp/persistence';
import clsx from 'clsx';
import { Open_Sans } from 'next/font/google';

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
  const festival = await getFestival();

  return (
    <html lang="en" className={clsx(openSans.variable)}>
      <head>
        <style>{themeStyles(festival)}</style>
        <style>{festival.globalStyles}</style>
      </head>

      <body>
        <div className="mx-auto col h-full max-w-4xl">
          <div className="flex-1 px-3 pb-16">{children}</div>
          <Navigation />
        </div>
      </body>
    </html>
  );
}
