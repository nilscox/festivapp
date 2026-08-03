import { useEffect, useState } from 'react';

export function useOverflows(ref: React.RefObject<HTMLElement | null>) {
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setOverflows(element.scrollHeight > element.clientHeight);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return overflows;
}
