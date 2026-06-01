'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavigationItem({
  icon,
  label,
  href,
  strict,
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  href: string;
  strict?: boolean;
}) {
  const pathname = usePathname();
  const isActive = strict ? pathname === href : pathname?.startsWith(href);

  return (
    <Link href={href} className={clsx('col h-full items-center justify-center gap-1.5', { 'opacity-60': !isActive })}>
      {icon}
      <div className="text-xs font-medium">{label}</div>
    </Link>
  );
}
