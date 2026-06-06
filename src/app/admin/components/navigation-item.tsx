'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ComponentProps } from 'react';

export function NavigationItem({
  href,
  strict,
  icon,
  children,
  ...props
}: ComponentProps<typeof Link> & { href: string; strict?: boolean; icon: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = strict ? pathname === href : pathname?.startsWith(href);

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          'relative row items-center gap-2 overflow-hidden rounded-md px-2 py-1 font-medium no-underline transition-colors hover:bg-gray-100',
          'before:absolute before:inset-y-0 before:left-0 before:border-indigo-400',
          {
            'pointer-events-none bg-gray-100 text-inherit before:border-l-3': isActive,
            'text-dim': !isActive,
          },
        )}
        {...props}
      >
        {icon}
        <div className="max-md:hidden">{children}</div>
      </Link>
    </li>
  );
}
