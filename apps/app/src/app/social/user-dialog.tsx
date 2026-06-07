import { User } from '@festivapp/persistence';
import { Trans, useLingui } from '@lingui/react/macro';
import { LogOutIcon } from 'lucide-react';

import { Button } from '@/components/button';
import { Dialog, DialogActions } from '@/components/dialog';
import { Input } from '@/components/input';

import { changeName, changeProfileImage, logOut } from './actions';
import { UserImage } from './user-image';

export function UserDialog({ user }: { user: User }) {
  const { t } = useLingui();

  return (
    <Dialog id="user-dialog" popover="" className="col max-w-md gap-6 not-open:hidden">
      <header className="row items-center gap-2">
        <UserImage user={user} className="shrink-0" />
        <div className="text-lg font-semibold">{user.name}</div>
      </header>

      <form action={changeName} className="col gap-2">
        <label htmlFor="name" className="text-sm">
          <Trans>Change your name</Trans>
        </label>
        <div className="row flex-wrap items-center gap-2">
          <Input id="name" name="name" defaultValue={user.name} placeholder={t`Display name`} className="flex-1" />
          <Button type="submit">
            <Trans>Save</Trans>
          </Button>
        </div>
      </form>

      <form action={changeProfileImage} className="col gap-2">
        <label htmlFor="image" className="text-sm">
          <Trans>Change your profile image</Trans>
        </label>
        <div className="row flex-wrap items-center gap-2">
          <Input type="file" name="image" accept=".bmp,.gif,.jpg,.jpeg,.png" className="min-w-0 flex-1" />
          <Button type="submit">
            <Trans>Save</Trans>
          </Button>
        </div>
      </form>

      <DialogActions>
        <form action={logOut}>
          <Button variant="ghost" type="submit" className="self-start">
            <LogOutIcon className="size-4 shrink-0" />
            <Trans>Log out</Trans>
          </Button>
        </form>
        <Button variant="ghost" popoverTarget="user-dialog" popoverTargetAction="hide">
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}
