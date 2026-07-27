import { Form } from '@base-ui/react/form';
import type { Location, TenantSummary } from '@festivapp/contracts';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { ConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Field } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page-header.tsx';
import { Select } from '../components/select.tsx';
import { Spinner } from '../components/spinner.tsx';
import { Table, TableHeader, TableHeaderCell } from '../components/table.tsx';
import { parseValidationError } from '../lib/errors.ts';
import { useCreateLocation, useDeleteLocation, useLocations, useUpdateLocation } from '../lib/locations.ts';
import { assert } from '../utils.ts';

const from = '/festivals/$tenantId/locations';

export function Locations() {
  const { tenant } = useRouteContext({ from });

  const { isPending, isError, isSuccess, data, error } = useLocations(tenant.id);
  const locations = data ?? [];

  return (
    <Page header={<Header tenant={tenant} showCreate={locations.length > 0} />}>
      {isPending && <Spinner className="mx-auto my-8 size-6" />}

      {isError && <>Error: {error.message}</>}

      {isSuccess && (
        <>
          {locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations yet"
              description="Locations are the stages, rooms and places where sessions happen. Add your first one to start building the schedule."
              cta={
                <LinkButton from={`/festivals/$tenantId/locations`} search={{ create: true }}>
                  <Plus className="size-4" />
                  Add location
                </LinkButton>
              }
            />
          ) : (
            <LocationsList tenant={tenant} locations={locations} />
          )}

          <LocationDrawer tenant={tenant} locations={locations} />
        </>
      )}
    </Page>
  );
}

function Header({ tenant, showCreate }: { tenant: TenantSummary; showCreate: boolean }) {
  return (
    <PageHeader
      eyebrow={tenant.name}
      title="Locations"
      end={
        showCreate && (
          <LinkButton from="/festivals/$tenantId/locations" search={{ create: true }} className="mt-auto">
            <Plus className="size-4" />
            <span className="max-md:hidden">Add location</span>
          </LinkButton>
        )
      }
    />
  );
}

function LocationsList({ tenant, locations }: { tenant: TenantSummary; locations: Location[] }) {
  const deleteMutation = useDeleteLocation(tenant.id);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Location | null>(null);

  const onDelete = (location: Location) => {
    setConfirmDeleteOpen(true);
    setConfirmDeleteTarget(location);
  };

  return (
    <div className="reveal">
      <p className="text-muted mb-3 font-mono text-xs tracking-wide">
        {locations.length} location{locations.length === 1 ? '' : 's'} &bull; shown to attendees in this order
      </p>

      <Table>
        <TableHeader>
          <TableHeaderCell className="w-6 text-center md:w-10">#</TableHeaderCell>
          <TableHeaderCell className="flex-1">Name</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHeader>

        {locations.map((location) => (
          <LocationItem key={location.id} location={location} onDelete={() => onDelete(location)} />
        ))}
      </Table>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => !open && setConfirmDeleteOpen(false)}
        onOpenChangeComplete={(open) => !open && setConfirmDeleteTarget(null)}
        title={`Delete "${confirmDeleteTarget?.name}"?`}
        description={`This removes the location from ${tenant.name}. Sessions assigned to it will need a new location. This can't be undone.`}
        confirmLabel="Delete"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          assert(confirmDeleteTarget);

          deleteMutation.mutate(confirmDeleteTarget.id, {
            onSuccess: () => {
              setConfirmDeleteTarget(null);
              setConfirmDeleteOpen(false);
            },
          });
        }}
      />
    </div>
  );
}

function LocationItem({ location, onDelete }: { location: Location; onDelete: () => void }) {
  return (
    <div className="hover:bg-subtle row items-center gap-3 p-3 md:gap-4 md:px-4">
      <span className="text-accent w-6 shrink-0 text-center font-mono text-sm font-semibold md:w-10">
        {location.position}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{location.name}</span>
      <div className="row shrink-0 items-center gap-1">
        <LinkButton variant="secondary" size="sm" from="/festivals/$tenantId/locations" search={{ edit: location.id }}>
          <Pencil className="size-3" />
          Edit
        </LinkButton>
        <IconButton
          icon={Trash2}
          variant="ghost"
          aria-label={`Delete ${location.name}`}
          onClick={onDelete}
          className="hover:text-danger"
        />
      </div>
    </div>
  );
}

function LocationDrawer({ tenant, locations }: { tenant: TenantSummary; locations: Location[] }) {
  const { create, edit: editId } = useSearch({ from });
  const open = create !== undefined || editId !== undefined;

  const navigate = useNavigate({ from });
  const onClose = () => navigate({ search: {} });

  return (
    <Drawer open={open} onOpenChange={(open) => !open && onClose()} title={create ? 'New location' : 'Edit location'}>
      <LocationForm
        tenant={tenant}
        locations={locations}
        defaultValue={editId ? locations.find((location) => location.id === editId) : undefined}
        onClose={onClose}
      />
    </Drawer>
  );
}

function LocationForm({
  tenant,
  locations,
  defaultValue,
  onClose,
}: {
  tenant: TenantSummary;
  locations: Location[];
  defaultValue?: Location;
  onClose: () => void;
}) {
  const positionOptions = Array.from(
    { length: Math.max(1, defaultValue ? locations.length : locations.length + 1) },
    (_, index) => ({ value: index + 1, label: String(index + 1) }),
  );

  const createMutation = useCreateLocation(tenant.id);
  const updateMutation = useUpdateLocation(tenant.id);

  const pending = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    return parseValidationError(createMutation.error ?? updateMutation.error);
  }, [createMutation.error, updateMutation.error]);

  const handleSubmit = (values: { name: string; position: number }) => {
    values.position = Number(values.position);

    if (!defaultValue) {
      createMutation.mutate(values, { onSuccess: onClose });
    } else {
      updateMutation.mutate({ id: defaultValue.id, ...values }, { onSuccess: onClose });
    }
  };

  return (
    <Form onFormSubmit={handleSubmit} className="col flex-1">
      <div className="col flex-1 gap-6 overflow-y-auto p-4">
        <Field
          name="name"
          label="Name"
          errors={[{ match: 'valueMissing', message: 'A location name is required.' }]}
          error={errors?.name?.errors[0]}
        >
          <Input required defaultValue={defaultValue?.name} placeholder="e.g. Main Stage" />
        </Field>

        <Field name="position" label="Position" error={errors?.position?.errors[0]}>
          <Select defaultValue={defaultValue?.position ?? locations.length + 1} items={positionOptions} />
        </Field>
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" className="flex-1" disabled={pending}>
          {!defaultValue ? 'Add location' : 'Save changes'}
        </Button>
      </div>
    </Form>
  );
}
