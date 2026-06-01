import { isEqual, isWithinInterval } from 'date-fns';
import { assert, defined } from 'src/utils';

import { schema } from './schema';

export type Festival = typeof schema.festivals.$inferSelect;
export type Location = typeof schema.locations.$inferSelect;
export type Event = typeof schema.events.$inferSelect;
export type Artist = typeof schema.artists.$inferSelect;
export type User = typeof schema.users.$inferSelect;
export type Post = typeof schema.posts.$inferSelect;

export type EventView = {
  id: string;
  type: 'event';
  title?: string;
  image?: string;
  shortInfo?: string;
  location: string;
  start: Date;
  end: Date;
  isLive: boolean;
};

export type EventBreak = {
  type: 'break';
  start: Date;
  end: Date;
};

export type EventSlot = EventView | EventBreak;

export function eventToView(
  now: Date,
  { artists, location, start, end, ...event }: Event & { location: Location; artists: Artist[] },
): EventView {
  return {
    id: event.id,
    type: 'event',
    title: event.title ?? artists[0]?.name,
    image: event.image ?? artists[0]?.image ?? undefined,
    shortInfo: artists[0]?.styles.join(' / '),
    location: location.label,
    start,
    end,
    isLive: isWithinInterval(now, { start, end }),
  };
}

export function addEventsBreaks(events: EventView[]): EventSlot[] {
  const result: ReturnType<typeof addEventsBreaks> = [];

  for (let i = 0; i < events.length; ++i) {
    const event = events.at(i);
    const next = events.at(i + 1);

    assert(event);

    result.push(event);

    if (next && !isEqual(event.end, next.start)) {
      result.push({ type: 'break', start: event.end, end: next.start });
    }
  }

  return result;
}

export type PostView = {
  id: string;
  author: { name: string; imageRef: string | null };
  postedAt: Date;
  message: string;
  likes: number;
  userLiked: boolean;
  replies: Array<Pick<PostView, 'id' | 'author' | 'message'>>;
};

export function postToView(
  post: Post & { author: User; replies: Array<Post & { author: User }> },
  likes: Map<string, number>,
  userLikes: Set<string>,
): PostView {
  return {
    id: post.id,
    author: { name: post.author.name, imageRef: post.author.imageRef },
    postedAt: post.postedAt,
    message: post.message,
    likes: defined(likes.get(post.id)),
    userLiked: userLikes.has(post.id),
    replies: post.replies.map((reply) => ({
      id: reply.id,
      author: { name: reply.author.name, imageRef: reply.author.imageRef },
      message: reply.message,
    })),
  };
}
