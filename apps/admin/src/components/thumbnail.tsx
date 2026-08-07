import type { ImagePosition } from '@festivapp/contracts';
import { formatImagePosition } from '@festivapp/utils';
import clsx from 'clsx';
import { Image } from 'lucide-react';

// a focal point is what makes cropping safe, so a thumbnail given one crops and the rest fit whole
export function Thumbnail({
  url,
  alt = '',
  position,
  background,
  className,
}: {
  url?: string | null;
  alt?: string;
  background?: string;
  position?: ImagePosition;
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
        style={position !== undefined ? { objectPosition: formatImagePosition(position) } : undefined}
        className={clsx(position !== undefined ? 'size-full object-cover' : 'object-contain')}
      />
    </div>
  );
}
