import { db, postToView } from '@festivapp/persistence';
import { schema } from '@festivapp/persistence/src/schema';
import { count, eq, inArray } from 'drizzle-orm';

import { getUser } from '@/server-utils';

import { createPost } from './actions';
import { CreatePostForm } from './create-post-form';
import { LogInDialog } from './log-in-dialog';
import { Post } from './post';
import { UserDialog } from './user-dialog';

export default async function () {
  const user = await getUser();
  const posts = await getPosts();

  return (
    <>
      {!user && <LogInDialog />}
      {user && <UserDialog user={user} />}

      <header>
        <h1>Community</h1>
      </header>

      <CreatePostForm />

      <ul className="my-8 col gap-2">
        {posts.map((post) => (
          <li key={post.id}>
            <Post post={post} createPost={createPost} />
          </li>
        ))}
      </ul>
    </>
  );
}

async function getPosts() {
  const user = await getUser();

  const posts = await db.query.posts.findMany({
    where: { parentId: { isNull: true } },
    with: { author: true, replies: { with: { author: true } } },
    orderBy: { postedAt: 'desc' },
  });

  const likes = await db
    .select({ postId: schema.posts.id, count: count(schema.likes.id) })
    .from(schema.posts)
    .leftJoin(schema.likes, eq(schema.posts.id, schema.likes.postId))
    .where(
      inArray(
        schema.posts.id,
        posts.map((post) => post.id),
      ),
    )
    .groupBy(schema.posts.id);

  const likesByPost = new Map(likes.map(({ postId, count }) => [postId, count]));

  const userLikes = new Set<string>();

  if (user) {
    const likes = await db.query.likes.findMany({
      where: { userId: user.id },
    });

    for (const { postId } of likes) {
      userLikes.add(postId);
    }
  }

  return posts.map((post) => postToView(post, likesByPost, userLikes));
}
