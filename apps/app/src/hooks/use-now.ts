import { isSameMinute, isValid } from 'date-fns';
import { useEffect, useState } from 'react';

export function useNow() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const cookie = document.cookie
      .split(';')
      .map((chunk) => chunk.trim().split('=') as [string, string])
      .reduce<Record<string, string>>((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    const date = new Date(cookie.now ?? '');

    if (isValid(date)) {
      setNow(date);
      return;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSameMinute(now, new Date())) {
        setNow(new Date());
      }
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [now]);

  return now;
}
