import { Button } from 'app/components/button';
import { Dialog, DialogActions } from 'app/components/dialog';
import { Input } from 'app/components/input';
import { LogOutIcon } from 'lucide-react';
import { User } from 'src/database/model';

import { changeName, changeProfileImage, logOut } from './actions';
import { UserImage } from './user-image';

export function UserDialog({ user }: { user: User }) {
  return (
    <Dialog id="user-dialog" popover="" className="col max-w-md gap-6 not-open:hidden">
      <header className="row items-center gap-2">
        <UserImage user={user} className="shrink-0" />
        <div className="text-lg font-semibold">{user.name}</div>
      </header>

      <form action={changeName} className="col gap-2">
        <label htmlFor="name" className="text-sm">
          Change your name
        </label>
        <div className="row flex-wrap items-center gap-2">
          <Input id="name" name="name" defaultValue={user.name} placeholder="Display name" className="flex-1" />
          <Button type="submit">Save</Button>
        </div>
      </form>

      <form action={changeProfileImage} className="col gap-2">
        <label htmlFor="image" className="text-sm">
          Change your profile image
        </label>
        <div className="row flex-wrap items-center gap-2">
          <Input type="file" name="image" accept=".bmp,.gif,.jpg,.jpeg,.png" className="min-w-0 flex-1" />
          <Button type="submit">Save</Button>
        </div>
      </form>

      <DialogActions>
        <form action={logOut}>
          <Button variant="ghost" type="submit" className="self-start">
            <LogOutIcon className="size-4 shrink-0" />
            Log out
          </Button>
        </form>
        <Button variant="ghost" popoverTarget="user-dialog" popoverTargetAction="hide">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
