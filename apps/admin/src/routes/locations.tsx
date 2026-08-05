import { Form } from '@base-ui/react/form';
import type { Location, LocationInput, LocationUpdate, TenantSummary } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Field } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { SearchSummary } from '../components/search.tsx';
import { Select } from '../components/select.tsx';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../components/table.tsx';
import { Textarea } from '../components/textarea.tsx';
import { api } from '../lib/api.ts';
import { parseValidationError } from '../lib/errors.ts';
import { listLocationsOptions, listSessionsOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/locations';

type FormValues = {
  name: string;
  description: string;
  position: number;
};

export function Locations() {
  const { tenant } = useRouteContext({ from });

  const query = useQuery(listLocationsOptions(tenant.id));

  return (
    <Page header={<Header tenant={tenant} showCreate={Boolean(query.data?.length)} />}>
      <QueryBoundary query={query}>
        {(locations) => (
          <>
            {locations.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No locations yet"
                description="Locations are the stages, rooms and places where sessions happen. Add your first one to start building the schedule."
                cta={
                  <LinkButton from={from} search={{ create: true }}>
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
      </QueryBoundary>
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
          <LinkButton from={from} search={{ create: true }} className="mt-auto">
            <Plus className="size-4" />
            <span className="max-md:hidden">Add location</span>
          </LinkButton>
        )
      }
    />
  );
}

function LocationsList({ tenant, locations }: { tenant: TenantSummary; locations: Location[] }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenant.id}/locations/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries(listLocationsOptions(tenant.id));
      await queryClient.invalidateQueries(listSessionsOptions(tenant.id));
    },
  });

  const confirm = useConfirmDialog();

  const onDelete = (location: Location) => {
    confirm({
      title: `Delete "${location.name}"?`,
      description: `This removes the location from ${tenant.name}, along with every session scheduled there. This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutateAsync(location.id),
    });
  };

  return (
    <div className="col gap-4">
      <SearchSummary items={locations} matching={locations} search="">
        {locations.length} location{locations.length === 1 ? '' : 's'} &bull; shown to attendees in this order
      </SearchSummary>

      <Table>
        <TableHeader>
          <TableHeaderCell className="w-12 text-center md:w-16">#</TableHeaderCell>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell className="w-32 text-end!">Actions</TableHeaderCell>
        </TableHeader>

        <TableBody>
          {locations.map((location) => (
            <LocationItem key={location.id} location={location} onDelete={() => onDelete(location)} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LocationItem({ location, onDelete }: { location: Location; onDelete: () => void }) {
  return (
    <TableRow>
      <TableCell className="text-accent text-center font-mono text-sm font-semibold">{location.position}</TableCell>

      <TableCell>
        <div className="truncate font-medium">{location.name}</div>
        {location.description && <div className="text-muted max-w-lg truncate text-xs">{location.description}</div>}
      </TableCell>

      <TableCell>
        <div className="row items-center justify-end gap-1">
          <LinkButton variant="secondary" size="sm" from={from} search={{ edit: location.id }}>
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
      </TableCell>
    </TableRow>
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
        defaultValue={editId ? locations.find(has('id', editId)) : undefined}
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
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: LocationInput) => api.post<Location>(`/admin/tenants/${tenant.id}/locations`, input),
    onSuccess: () => queryClient.invalidateQueries(listLocationsOptions(tenant.id)),
  });

  const updateMutation = useMutation({
    mutationFn: ([id, input]: [id: string, input: LocationUpdate]) =>
      api.patch<Location>(`/admin/tenants/${tenant.id}/locations/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries(listLocationsOptions(tenant.id)),
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    return parseValidationError(createMutation.error ?? updateMutation.error);
  }, [createMutation.error, updateMutation.error]);

  const positionOptions = Array.from(
    { length: Math.max(1, defaultValue ? locations.length : locations.length + 1) },
    (_, index) => ({ value: index + 1, label: String(index + 1) }),
  );

  const handleSubmit = (values: FormValues) => {
    const input = {
      name: values.name,
      description: values.description,
      position: Number(values.position),
    };

    if (!defaultValue) {
      createMutation.mutate(input, { onSuccess: onClose });
    } else {
      updateMutation.mutate([defaultValue.id, input], { onSuccess: onClose });
    }
  };

  return (
    <Form errors={errors} onFormSubmit={handleSubmit} className="col flex-1">
      <div className="col flex-1 gap-6 overflow-y-auto p-4">
        <Field name="name" label="Name" errors={[{ match: 'valueMissing', message: 'A location name is required.' }]}>
          <Input required defaultValue={defaultValue?.name} placeholder="e.g. Main Stage" />
        </Field>

        <Field name="position" label="Position">
          <Select defaultValue={defaultValue?.position ?? locations.length + 1} items={positionOptions} />
        </Field>

        <Field name="description" label="Description" hint="Shown to attendees on the map.">
          <Textarea rows={4} defaultValue={defaultValue?.description ?? ''} />
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
