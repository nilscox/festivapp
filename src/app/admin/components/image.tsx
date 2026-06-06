import clsx from 'clsx';
import { ImageIcon } from 'lucide-react';

export function Image({ src, className }: { src?: string | null; className?: string }) {
  if (!src) {
    return (
      <div className={clsx(className, 'col items-center justify-center bg-gray-200')}>
        <ImageIcon className="size-24 text-gray-400" />
      </div>
    );
  }

  return <img alt="" src={src} className={className} />;
}
