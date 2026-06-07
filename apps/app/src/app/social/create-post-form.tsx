import { SendIcon } from 'lucide-react';

import { Button } from '@/components/button';
import { getUser } from '@/server-utils';

import { createPost } from './actions';
import { UserImage } from './user-image';

export async function CreatePostForm() {
  const user = await getUser();

  return (
    <div className="relative">
      <form action={createPost} className="my-8 col gap-2 rounded-md bg-light p-2 text-dark">
        <div className="row items-start gap-2">
          <UserImage user={user} openUserDialog className="shrink-0" />
          <textarea
            name="message"
            aria-label="Message"
            placeholder="What's up?"
            rows={3}
            className="w-full rounded-lg p-2"
          />
        </div>

        <button type="submit" className="ml-auto row items-center gap-2 rounded-md px-3 py-1">
          <SendIcon className="size-4" />
          <div>Post</div>
        </button>
      </form>

      {!user && (
        <div className="absolute inset-0 col items-center justify-center rounded-md bg-light/50 text-dark">
          <Button variant="primary" popoverTarget="log-in-dialog">
            Log in
          </Button>
        </div>
      )}
    </div>
  );
}
