import clsx from 'clsx';
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google';

import { configureI18n } from '@/i18n/i18n';
import { LinguiClientProvider } from '@/i18n/lingui-client-provider';

import '../styles.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-title',
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default function LocaleLayout({ children, params }: Props) {
  const i18n = configureI18n(params);

  return (
    <html lang={i18n.locale} className={clsx(plusJakartaSans.variable, dmSans.variable)}>
      <body>
        <LinguiClientProvider initialLocale={i18n.locale} initialMessages={i18n.messages}>
          {children}
        </LinguiClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}
