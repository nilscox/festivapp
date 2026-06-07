import clsx from 'clsx';
import { Open_Sans } from 'next/font/google';
import Link from 'next/link';

import './styles.css';

const openSans = Open_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={clsx(openSans.variable)}>
      <body>
        <div className="mx-auto col h-full max-w-6xl px-4">
          <header className="row items-center justify-between border-b border-gray-300 py-4">
            <Link href="/" className="text-lg font-semibold text-inherit no-underline">
              Festivapp Admin
            </Link>
          </header>

          <main className="flex-1 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
