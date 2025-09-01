import { useSearchParams } from '@solidjs/router';
import { isSameMinute } from 'date-fns';
import { createSignal, onCleanup } from 'solid-js';

export function useNow() {
  const [searchParams] = useSearchParams();
  const nowParam = searchParams.now;

  if (typeof nowParam === 'string') {
    return () => new Date(nowParam);
  }

  const [now, setNow] = createSignal(new Date());

  const interval = setInterval(() => {
    const currentNow = new Date();

    if (!isSameMinute(now(), currentNow)) {
      setNow(currentNow);
    }
  }, 1_000);

  onCleanup(() => clearInterval(interval));

  return now;
}
