import { useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function useClock(): Date {
  const search = useSearch({ from: '__root__' });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);

    return () => window.clearInterval(id);
  }, []);

  if (search.date) {
    return new Date(search.date);
  }

  return now;
}
