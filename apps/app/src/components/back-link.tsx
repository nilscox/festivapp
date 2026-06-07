'use client';

import Link from 'next/link';

export function BackLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link
      href="/"
      onNavigate={(event) => {
        if (window.history.length >= 2) {
          event.preventDefault();
          window.history.back();
        }
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
