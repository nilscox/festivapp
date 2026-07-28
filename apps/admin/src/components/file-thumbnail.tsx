import clsx from 'clsx';

export function FileThumbnail({
  url,
  alt,
  background,
  className,
}: {
  url: string;
  alt: string;
  background?: string;
  className?: string;
}) {
  return (
    <div
      style={background !== undefined ? { backgroundColor: background } : undefined}
      className={clsx('bg-subtle flex items-center justify-center overflow-hidden p-2', className)}
    >
      <img src={url} alt={alt} loading="lazy" className="max-h-full max-w-full object-contain" />
    </div>
  );
}
