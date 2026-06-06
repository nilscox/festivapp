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
          'px-2 py-1 font-medium rounded-md no-underline hover:bg-gray-100 before:border-indigo-400 before:absolute before:inset-y-0 relative before:left-0 overflow-hidden transition-colors row gap-2 items-center',
          {
            'bg-gray-100 pointer-events-none text-inherit before:border-l-3': isActive,
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
