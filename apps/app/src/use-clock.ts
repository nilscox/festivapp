import { useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function useClock(): Date {
  const { date: dateParam } = useSearch({ strict: false });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 15_000);

    return () => window.clearInterval(id);
  }, []);

  if (dateParam) {
    return new Date(dateParam);
  }

  return now;
}
