import clsx from 'clsx';
import { HeartIcon } from 'lucide-react';
import { Input } from 'src/components/input';
import { Post } from 'src/database/model';

import { toggleLike } from './actions';

export function LikesButton({
  post,
  userLiked,
  className,
}: {
  post: Post & { likes: number };
  userLiked: boolean;
  className?: string;
}) {
  return (
    <form action={toggleLike} className={clsx(className, { 'text-red-600': userLiked })}>
      <Input type="hidden" name="postId" value={post.id} />

      <button type="submit">
        <HeartIcon className={clsx('size-4', { 'fill-current': userLiked })} />
        <div className="text-sm font-medium">{post.likes}</div>
      </button>
    </form>
  );
}
