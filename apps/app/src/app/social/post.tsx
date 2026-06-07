import { PostView } from '@festivapp/persistence';
import { formatDistanceAbbreviated } from '@festivapp/utils/client';
import clsx from 'clsx';
import { formatDistance } from 'date-fns';
import { HeartIcon, MessageCircleIcon, SendIcon, Share2Icon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/button';
import { CollapsibleContent, CollapsibleProvider, CollapsibleTrigger } from '@/components/collapsible';
import { Input } from '@/components/input';
import { ShareButton } from '@/components/share-button';
import { TextareaAutoResize } from '@/components/textarea-auto-resize';
import { getCurrentHostname, getNow, getUser } from '@/server-utils';

import { toggleLike } from './actions';
import { UserImage } from './user-image';

export async function Post({
  post,
  createPost,
}: {
  post: PostView;
  createPost: (formData: FormData) => Promise<void>;
}) {
  const now = await getNow();

  return (
    <div
      id={post.id}
      className="row items-start gap-2 rounded-md bg-light px-2 py-3 text-dark outline-offset-3 outline-accent target:outline-2"
    >
      <UserImage user={post.author} className="shrink-0" />

      <div className="col grow gap-2">
        <div className="row items-center gap-2">
          <div className="leading-none font-medium">{post.author.name}</div>
          <Link href={`#${post.id}`} className="text-xs text-dim">
            {formatDistance(post.postedAt, now, {
              addSuffix: true,
              locale: { formatDistance: formatDistanceAbbreviated },
            })}
          </Link>
        </div>

        <div className="text-sm whitespace-pre-wrap">{post.message}</div>

        <CollapsibleProvider>
          <Actions post={post} />

          <CollapsibleContent>
            <Replies post={post} />
            <ReplyForm post={post} createPost={createPost} />
          </CollapsibleContent>
        </CollapsibleProvider>
      </div>
    </div>
  );
}

function Actions({ post }: { post: PostView }) {
  return (
    <div className="row gap-6 text-dim">
      <LikesButton post={post} />
      <RepliesButton post={post} />
      <SharePostButton post={post} />
    </div>
  );
}

async function LikesButton({ post }: { post: PostView }) {
  const user = await getUser();

  return (
    <form action={toggleLike} className={clsx({ 'text-red-600': post.userLiked })}>
      <Input type="hidden" name="postId" value={post.id} />

      <button
        type={user ? 'submit' : 'button'}
        popoverTarget={!user ? 'log-in-dialog' : undefined}
        className="row items-center gap-1 rounded-sm outline-offset-4"
      >
        <HeartIcon className={clsx('size-4', { 'fill-current': post.userLiked })} />
        <div className="text-middle text-sm font-medium">{post.likes}</div>
      </button>
    </form>
  );
}

async function RepliesButton({ post }: { post: PostView }) {
  const user = await getUser();

  return (
    <CollapsibleTrigger
      disabled={post.replies.length === 0 && !user}
      className="row items-center gap-1 rounded-sm outline-offset-4"
    >
      <MessageCircleIcon className="size-4" />
      <div className="text-middle text-sm font-medium">{post.replies.length}</div>
    </CollapsibleTrigger>
  );
}

async function SharePostButton({ post }: { post: PostView }) {
  return (
    <ShareButton
      title={`Message from ${post.author.name}`}
      url={`${await getCurrentHostname()}/social#${post.id}`}
      className="row items-center gap-1 rounded-sm outline-offset-4"
    >
      <Share2Icon className="size-4" />
      <div className="text-middle text-sm font-medium">Share</div>
    </ShareButton>
  );
}

async function Replies({ post }: { post: PostView }) {
  const now = await getNow();

  return (
    <ul className="mt-2 col gap-2 border-t border-gray-300 pt-2">
      {post.replies.map((reply) => (
        <li key={reply.id} className="row items-start gap-2">
          <UserImage user={post.author} size="small" className="shrink-0" />

          <div>
            <div className="row items-center gap-2 leading-none">
              <div className="text-sm font-medium">{reply.author.name}</div>
              <div className="text-xs text-dim">
                {formatDistance(post.postedAt, now, {
                  addSuffix: true,
                  locale: { formatDistance: formatDistanceAbbreviated },
                })}
              </div>
            </div>

            <div className="text-sm whitespace-pre-wrap">{reply.message}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function ReplyForm({ post, createPost }: { post: PostView; createPost: (formData: FormData) => Promise<void> }) {
  const user = await getUser();

  if (!user) {
    return null;
  }

  return (
    <form action={createPost} className="row items-start gap-2">
      <UserImage user={user} size="small" className="mt-1.5 shrink-0" />

      <Input type="hidden" name="parentId" value={post.id} />

      <TextareaAutoResize
        name="message"
        placeholder="Write a comment..."
        rows={1}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      <Button type="submit" variant="ghost" className="mt-2">
        <SendIcon className="size-4" />
      </Button>
    </form>
  );
}
