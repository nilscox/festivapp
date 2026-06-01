import clsx from 'clsx';
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google';

import './styles.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-title',
  subsets: ['latin'],
});

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html className={clsx(plusJakartaSans.variable, dmSans.variable)}>
      <body>{children}</body>
    </html>
  );
}
