import clsx from 'clsx';
import { Open_Sans } from 'next/font/google';
import Link from 'next/link';

import { getAuthUser } from '@/server-utils';

import { logout } from './actions';
import './styles.css';

const openSans = Open_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
});

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const admin = await getAuthUser().catch(() => null);

  return (
    <html lang="en" className={clsx(openSans.variable)}>
      <body>
        <div className="mx-auto col h-full max-w-6xl px-4">
          <header className="row items-center justify-between border-b border-gray-300 py-4">
            <Link href="/" className="text-lg font-semibold text-inherit no-underline">
              Festivapp Admin
            </Link>

            {admin && (
              <div className="text-end">
                <div>{admin.name}</div>
                <form action={logout}>
                  <button type="submit" className="text-sm text-dim cursor-pointer">
                    Log out
                  </button>
                </form>
              </div>
            )}
          </header>

          <main className="flex-1 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
