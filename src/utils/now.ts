import { NavigateOptions, useSearchParams } from '@solidjs/router';
import { isSameMinute } from 'date-fns';
import { createSignal, onCleanup } from 'solid-js';

function useSearchParam(name: string) {
  const [params, setParams] = useSearchParams();

  return [
    params[name],
    (value: string, options: Partial<NavigateOptions>) => setParams({ ...params, [name]: value }, options),
  ] as const;
}

export function createNow() {
  const [nowParam] = useSearchParam('now');

  if (nowParam) {
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
