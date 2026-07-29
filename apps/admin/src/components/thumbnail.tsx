import clsx from 'clsx';
import { Image } from 'lucide-react';

export function Thumbnail({
  url,
  alt = '',
  fit = 'contain',
  background,
  className,
}: {
  url?: string | null;
  alt?: string;
  background?: string;
  fit?: 'contain' | 'cover';
  className?: string;
}) {
  if (!url) {
    return (
      <div
        className={clsx(
          'bg-subtle text-faint flex items-center justify-center rounded-lg border border-dashed p-2',
          className,
        )}
      >
        <Image className="size-full" />
      </div>
    );
  }

  return (
    <div
      style={background !== undefined ? { backgroundColor: background } : undefined}
      className={clsx('bg-subtle flex items-center justify-center overflow-hidden rounded-lg', className)}
    >
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className={clsx({ 'max-h-full max-w-full object-cover': fit === 'cover', 'object-contain': fit === 'contain' })}
      />
    </div>
  );
}
