import { Form } from '@base-ui-components/react/form';
import type { Location } from '@festivapp/contracts';
import { useParams } from '@tanstack/react-router';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../components/button.tsx';
import { ConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer } from '../components/drawer.tsx';
import { Eyebrow } from '../components/eyebrow.tsx';
import { SelectField } from '../components/select-field.tsx';
import { TextField } from '../components/text-field.tsx';
import { useMe } from '../lib/auth.ts';
import { useCreateLocation, useDeleteLocation, useLocations, useUpdateLocation } from '../lib/locations.ts';

type DrawerState = { mode: 'new' } | { mode: 'edit'; location: Location };

export function Locations() {
  const { tenantId } = useParams({ strict: false });
  const me = useMe();

  const locationsQuery = useLocations(tenantId!);
  const create = useCreateLocation(tenantId!);
  const update = useUpdateLocation(tenantId!);
  const remove = useDeleteLocation(tenantId!);

  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Location | null>(null);

  const list = locationsQuery.data ?? [];
  const festivalName = me.data?.tenants.find((tenant) => tenant.id === tenantId)?.name;

  return (
    <>
      <div className="border-line flex items-center justify-between border-b px-8 py-5">
        <div>
          <Eyebrow>{festivalName ? `${festivalName} · Manage` : 'Manage'}</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Locations</h1>
        </div>
        {list.length > 0 && (
          <Button onClick={() => setDrawer({ mode: 'new' })}>
            <Plus className="size-4" />
            Add location
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {locationsQuery.isPending ? (
          <LocationsSkeleton />
        ) : list.length === 0 ? (
          <EmptyState onAdd={() => setDrawer({ mode: 'new' })} />
        ) : (
          <div className="reveal">
            <p className="text-muted mb-3 font-mono text-xs tracking-wide">
              {list.length} location{list.length === 1 ? '' : 's'} · shown to attendees in this order
            </p>
            <div className="border-line overflow-hidden rounded-2xl border">
              <div className="border-line bg-subtle flex items-center gap-4 border-b px-5 py-3">
                <HeaderCell className="w-10 text-center">#</HeaderCell>
                <HeaderCell className="flex-1">Name</HeaderCell>
                <HeaderCell>Actions</HeaderCell>
              </div>
              {list.map((location, index) => (
                <div
                  key={location.id}
                  className="border-line/60 hover:bg-subtle flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0"
                >
                  <span className="text-accent w-10 text-center font-mono text-sm font-semibold">{index + 1}</span>
                  <span className="text-form flex-1 font-medium">{location.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDrawer({ mode: 'edit', location })}
                      className="hover:border-accent hover:text-accent"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                    <button
                      aria-label={`Delete ${location.name}`}
                      onClick={() => setConfirmTarget(location)}
                      className="text-faint hover:bg-danger-soft hover:text-danger flex size-8 cursor-pointer items-center justify-center rounded-lg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {drawer && (
        <LocationDrawer
          state={drawer}
          count={list.length}
          pending={create.isPending || update.isPending}
          onClose={() => setDrawer(null)}
          onSubmit={(input) => {
            if (drawer.mode === 'new') {
              create.mutate(input, { onSuccess: () => setDrawer(null) });
            } else {
              update.mutate({ id: drawer.location.id, input }, { onSuccess: () => setDrawer(null) });
            }
          }}
        />
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={`Delete "${confirmTarget?.name}"?`}
        description={`This removes the location from ${festivalName ?? 'this festival'}. Sessions assigned to it will need a new location. This can't be undone.`}
        confirmLabel="Delete"
        pending={remove.isPending}
        onConfirm={() => {
          if (confirmTarget) {
            remove.mutate(confirmTarget.id, { onSuccess: () => setConfirmTarget(null) });
          }
        }}
      />
    </>
  );
}

function LocationDrawer({
  state,
  count,
  pending,
  onClose,
  onSubmit,
}: {
  state: DrawerState;
  count: number;
  pending: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; position: number }) => void;
}) {
  const isNew = state.mode === 'new';
  const maxPosition = isNew ? count + 1 : count;
  const initialPosition = isNew ? count + 1 : Math.min(Math.max(1, state.location.position), maxPosition);

  const [position, setPosition] = useState(initialPosition);

  const positionOptions = Array.from({ length: Math.max(1, maxPosition) }, (_, index) => {
    const value = index + 1;
    const suffix = value === 1 ? ' (first)' : value === maxPosition ? ' (last)' : '';

    return { value, label: `Position ${value}${suffix}` };
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim();

    console.warn('SUBMIT-FIRED name=[' + name + '] position=' + position);

    if (!name) {
      return;
    }

    onSubmit({ name, position });
  }

  return (
    <Drawer
      open
      onOpenChange={(open) => !open && onClose()}
      eyebrow={isNew ? 'New location' : 'Edit location'}
      title={isNew ? 'New location' : 'Edit location'}
    >
      <Form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <TextField
            label="Name"
            name="name"
            required
            defaultValue={isNew ? undefined : state.location.name}
            placeholder="e.g. Main Stage"
            errors={[{ match: 'valueMissing', message: 'A location name is required.' }]}
          />
          <SelectField label="Position in list" value={position} onValueChange={setPosition} items={positionOptions} />
          <p className="text-faint -mt-3 text-xs">Attendees see locations in this order.</p>
        </div>
        <div className="border-line flex gap-2.5 border-t p-5">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={pending}>
            {isNew ? 'Add location' : 'Save changes'}
          </Button>
        </div>
      </Form>
    </Drawer>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="reveal border-line-strong flex flex-col items-center rounded-2xl border border-dashed px-10 py-18 text-center">
      <div className="bg-well text-faint mb-4 flex size-15 items-center justify-center rounded-2xl">
        <MapPin className="size-7" />
      </div>
      <h2 className="text-xl font-bold">No locations yet</h2>
      <p className="text-muted mt-2 max-w-95 text-sm text-pretty">
        Locations are the stages, tents and rooms where sessions happen. Add your first one to start building the
        schedule.
      </p>
      <Button className="mt-6" onClick={onAdd}>
        <Plus className="size-4" />
        Add location
      </Button>
    </div>
  );
}

function LocationsSkeleton() {
  return (
    <div className="border-line overflow-hidden rounded-2xl border">
      <div className="border-line bg-subtle flex items-center gap-4 border-b px-5 py-3">
        <HeaderCell className="w-10 text-center">#</HeaderCell>
        <HeaderCell className="flex-1">Name</HeaderCell>
      </div>
      {['60%', '45%', '72%', '38%', '55%'].map((width, index) => (
        <div key={index} className="border-line/60 flex items-center gap-4 border-b px-5 py-4.5 last:border-b-0">
          <div className="skel bg-well size-6 rounded-md" />
          <div className="skel bg-well h-3.5 rounded" style={{ width }} />
        </div>
      ))}
    </div>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-xxs text-faint font-mono tracking-widest uppercase ${className ?? ''}`}>{children}</span>
  );
}
