import clsx from 'clsx';
import { UserRoundIcon } from 'lucide-react';

export function UserImage({
  user,
  openUserDialog,
  size = 'medium',
  className,
}: {
  user?: { imageRef: string | null };
  openUserDialog?: boolean;
  size?: 'small' | 'medium';
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={!openUserDialog}
      popoverTarget={openUserDialog ? 'user-dialog' : undefined}
      className={clsx(className, 'overflow-hidden rounded-full', {
        'size-10': size === 'medium',
        'size-6': size === 'small',
      })}
    >
      {user?.imageRef ? (
        <img src={`/uploads/${user.imageRef}`} className="size-full object-cover" />
      ) : (
        <div className={clsx('bg-primary', { 'p-2': size === 'medium', 'p-1': size === 'small' })}>
          <UserRoundIcon className="size-full text-accent" />
        </div>
      )}
    </button>
  );
}
