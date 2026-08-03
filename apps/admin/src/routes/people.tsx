import { Form } from '@base-ui/react/form';
import type { Participant, ParticipantInput, TenantSummary } from '@festivapp/contracts';
import { has, matchesSearch } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { Chip } from '../components/chip.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { FieldArray, getFieldArrayValues, useFieldArray } from '../components/field-array.tsx';
import { Field } from '../components/field.tsx';
import { FileInput } from '../components/file-input.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { NoMatch, SearchInput, SearchSummary } from '../components/search.tsx';
import { Table, TableHeader, TableHeaderCell } from '../components/table.tsx';
import { Textarea } from '../components/textarea.tsx';
import { Thumbnail } from '../components/thumbnail.tsx';
import { useSearchParam } from '../hooks/use-search-param.ts';
import { api } from '../lib/api.ts';
import { parseValidationError } from '../lib/errors.ts';
import { getThemeOptions, listParticipantsOptions, listSessionsOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/people';

type FormValues = {
  name: string;
  origin: string;
  label: string;
  description: string;
};

export function People() {
  const { tenant } = useRouteContext({ from });

  const query = useQuery(listParticipantsOptions(tenant.id));

  return (
    <Page header={<Header tenant={tenant} showCreate={Boolean(query.data?.length)} />}>
      <QueryBoundary query={query}>
        {(participants) => (
          <>
            <PeopleList tenant={tenant} participants={participants} />
            <ParticipantDrawer tenant={tenant} participants={participants} />
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
      title="People"
      end={
        showCreate && (
          <LinkButton from={from} search={(prev) => ({ ...prev, create: true })} className="mt-auto">
            <Plus className="size-4" />
            <span className="max-md:hidden">Add people</span>
          </LinkButton>
        )
      }
    />
  );
}

function PeopleList({ tenant, participants }: { tenant: TenantSummary; participants: Participant[] }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenant.id}/participants/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries(listParticipantsOptions(tenant.id));
      await queryClient.invalidateQueries(listSessionsOptions(tenant.id));
    },
  });

  const confirm = useConfirmDialog();

  const onDelete = (participant: Participant) => {
    confirm({
      title: `Delete "${participant.name}"?`,
      description: `This removes ${participant.name} from ${tenant.name} and from every session they appear on. This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutateAsync(participant.id),
    });
  };

  const [search, setSearch] = useSearchParam(from);

  const matching = participants.filter((participant) =>
    matchesSearch(search, participant.name, participant.label, participant.origin, ...participant.styles),
  );

  if (participants.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nobody on the line-up yet"
        description="People are the acts on your line-up — artists, speakers, facilitators. Add them here, then put them on sessions in the schedule."
        cta={
          <LinkButton from={from} search={{ create: true }}>
            <Plus className="size-4" />
            Add people
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="col gap-4">
      <SearchInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search by name, label, origin or style"
        className="md:max-w-96"
      />

      <SearchSummary search={search} items={participants} matching={matching}>
        {participants.length} {participants.length === 1 ? 'person' : 'people'} &bull; listed alphabetically
      </SearchSummary>

      {matching.length === 0 && (
        <NoMatch
          title="Nobody matches that"
          description="No one on the line-up matches this search. Try a shorter or different term."
          onClear={() => setSearch('')}
        />
      )}

      {matching.length > 0 && (
        <Table>
          <TableHeader>
            <TableHeaderCell className="flex-1">Name</TableHeaderCell>
            <TableHeaderCell className="flex-1 max-md:hidden">Styles</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>

          {matching.map((participant) => (
            <ParticipantItem
              key={participant.id}
              tenant={tenant}
              participant={participant}
              onDelete={() => onDelete(participant)}
            />
          ))}
        </Table>
      )}
    </div>
  );
}

function ParticipantItem({
  tenant,
  participant,
  onDelete,
}: {
  tenant: TenantSummary;
  participant: Participant;
  onDelete: () => void;
}) {
  const { data: theme } = useQuery(getThemeOptions(tenant.id));

  return (
    <div className="hover:bg-subtle row items-center gap-3 p-3 md:gap-4 md:px-4">
      <Thumbnail
        background={theme?.backgroundColor}
        url={participant.imageUrl}
        alt={participant.name}
        className="size-10"
      />

      <div className="col min-w-0 flex-1 gap-0.5">
        <span className="truncate font-medium">{participant.name}</span>
        {participant.label && <span className="text-faint text-xxs truncate font-mono">{participant.label}</span>}
      </div>

      <div className="row min-w-0 flex-1 flex-wrap gap-1 max-md:hidden">
        {participant.styles.map((style) => (
          <Chip key={style}>{style}</Chip>
        ))}
      </div>

      <div className="row shrink-0 items-center gap-1">
        <LinkButton variant="secondary" size="sm" from={from} search={(prev) => ({ ...prev, edit: participant.id })}>
          <Pencil className="size-3" />
          Edit
        </LinkButton>
        <IconButton
          icon={Trash2}
          variant="ghost"
          aria-label={`Delete ${participant.name}`}
          onClick={onDelete}
          className="hover:text-danger"
        />
      </div>
    </div>
  );
}

function ParticipantDrawer({ tenant, participants }: { tenant: TenantSummary; participants: Participant[] }) {
  const { create, edit: editId } = useSearch({ from });
  const open = create !== undefined || editId !== undefined;

  const navigate = useNavigate({ from });
  const onClose = () => navigate({ search: (prev) => ({ search: prev.search }) });

  return (
    <Drawer
      open={open}
      onOpenChange={(open) => !open && onClose()}
      title={create ? 'New person or band' : 'Edit person or band'}
    >
      <ParticipantForm
        tenant={tenant}
        defaultValue={editId ? participants.find(has('id', editId)) : undefined}
        onClose={onClose}
      />
    </Drawer>
  );
}

function ParticipantForm({
  tenant,
  defaultValue,
  onClose,
}: {
  tenant: TenantSummary;
  defaultValue?: Participant;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries(listParticipantsOptions(tenant.id));

  const createMutation = useMutation({
    mutationFn: (input: ParticipantInput) => api.post<Participant>(`/admin/tenants/${tenant.id}/participants`, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ([id, input]: [id: string, participant: ParticipantInput]) =>
      api.patch<Participant>(`/admin/tenants/${tenant.id}/participants/${id}`, input),
    onSuccess: invalidate,
  });

  const [imageUrl, setImageUrl] = useState(defaultValue?.imageUrl ?? null);

  const pending = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    return parseValidationError(createMutation.error ?? updateMutation.error);
  }, [createMutation.error, updateMutation.error]);

  const handleSubmit = (values: FormValues) => {
    const input: ParticipantInput = {
      name: values.name,
      description: values.description.trim() || null,
      imageUrl,
      origin: values.origin.trim() || null,
      label: values.label.trim() || null,
      styles: getFieldArrayValues(values, 'styles', nonEmptyString),
      socialLinks: getFieldArrayValues(values, 'socialLinks', nonEmptyString),
    };

    if (!defaultValue) {
      createMutation.mutate(input, { onSuccess: onClose });
    } else {
      updateMutation.mutate([defaultValue.id, input], { onSuccess: onClose });
    }
  };

  return (
    <Form errors={errors} onFormSubmit={handleSubmit} className="col min-h-0 flex-1">
      <div className="col min-h-0 flex-1 gap-6 overflow-y-auto p-4">
        <Field name="name" label="Name" errors={[{ match: 'valueMissing', message: 'A name is required.' }]}>
          <Input required defaultValue={defaultValue?.name} placeholder="Johnny Purple" />
        </Field>

        <Field label="Picture" hint="Shown on the session's page in the app.">
          <FileInput tenantId={tenant.id} value={imageUrl} onValueChange={setImageUrl} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="label" label="Label" hint="Artists only.">
            <Input defaultValue={defaultValue?.label ?? ''} placeholder="Trip Records" />
          </Field>

          <Field name="origin" label="Origin" hint="Artists only.">
            <Input defaultValue={defaultValue?.origin ?? ''} placeholder="Berlin" />
          </Field>
        </div>

        <StylesEditor styles={defaultValue?.styles} />

        <Field name="description" label="Description">
          <Textarea rows={6} defaultValue={defaultValue?.description ?? ''} />
        </Field>

        <SocialLinksEditor links={defaultValue?.socialLinks} />
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" className="flex-1" disabled={pending}>
          {!defaultValue ? 'Add person' : 'Save changes'}
        </Button>
      </div>
    </Form>
  );
}

function StylesEditor({ styles = [] }: { styles?: string[] }) {
  const { fields, append, remove } = useFieldArray(styles);

  return (
    <FieldArray
      fields={fields}
      name="styles"
      onAdd={() => append('')}
      onRemove={remove}
      label="Styles"
      add="Add a style"
    >
      {(style, index) => (
        <Field>
          <Input name={`styles.${index}`} defaultValue={style} placeholder="e.g. techno" />
        </Field>
      )}
    </FieldArray>
  );
}

function SocialLinksEditor({ links = [] }: { links?: string[] }) {
  const { fields, append, remove } = useFieldArray(links);

  return (
    <FieldArray
      fields={fields}
      name="socialLinks"
      onAdd={() => append('')}
      onRemove={remove}
      label="Links"
      add="Add a link"
    >
      {(link, index) => (
        <Field errors={[{ match: 'typeMismatch', message: 'Enter a full URL, starting with https://' }]}>
          <Input type="url" name={`socialLinks.${index}`} defaultValue={link} placeholder="https://" />
        </Field>
      )}
    </FieldArray>
  );
}

function nonEmptyString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.trim() || undefined;
}
