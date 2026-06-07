'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent } from 'react';

import { Input } from '@/components/input';

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  let timeoutId: number | null = null;

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    const value = event.target.value;

    timeoutId = window.setTimeout(() => {
      if (value) {
        router.replace(`${pathname}?${new URLSearchParams({ search: value })}`);
      } else {
        router.replace(pathname);
      }
    }, 600);
  };

  return (
    <Input
      type="search"
      name="search"
      placeholder="Search..."
      defaultValue={searchParams.get('search') ?? ''}
      onChange={onChange}
    />
  );
}
