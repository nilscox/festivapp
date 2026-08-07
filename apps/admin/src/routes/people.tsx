import type { Participant, ParticipantInput, TenantSummary } from '@festivapp/contracts';
import { has, matchesSearch } from '@festivapp/utils';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import clsx from 'clsx';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useDeferredValue } from 'react';
import * as z from 'zod/mini';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { Chip } from '../components/chip.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer, useDrawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Form, SubmitButton, useAppForm } from '../components/form/form.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { NoMatch, SearchInput, SearchSummary } from '../components/search.tsx';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../components/table.tsx';
import { Thumbnail } from '../components/thumbnail.tsx';
import { useSearchParam } from '../hooks/use-search-param.ts';
import { api } from '../lib/api.ts';
import { submitToApi } from '../lib/errors.ts';
import { getThemeOptions, listParticipantsOptions, listSessionsOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/people';

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

  const [search = '', setSearch] = useSearchParam({ from, name: 'search' });
  const deferredSearch = useDeferredValue(search);

  const matching = participants.filter((participant) =>
    matchesSearch(deferredSearch, participant.name, participant.label, participant.origin, ...participant.styles),
  );

  const hash = useLocation({ select: (location) => location.hash });

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
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell className="max-md:hidden">Styles</TableHeaderCell>
            <TableHeaderCell className="w-32 text-end!">Actions</TableHeaderCell>
          </TableHeader>

          <TableBody>
            {matching.map((participant) => (
              <ParticipantItem
                key={participant.id}
                tenant={tenant}
                participant={participant}
                highlighted={hash === participant.id}
                onDelete={() => onDelete(participant)}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ParticipantItem({
  tenant,
  participant,
  highlighted,
  onDelete,
}: {
  tenant: TenantSummary;
  participant: Participant;
  highlighted: boolean;
  onDelete: () => void;
}) {
  const { data: theme } = useQuery(getThemeOptions(tenant.id));

  return (
    <TableRow id={participant.id} className={clsx('scroll-mt-32', highlighted && 'bg-accent/8')}>
      <TableCell>
        <div className="row items-center gap-3 md:gap-4">
          <Thumbnail
            background={theme?.backgroundColor}
            url={participant.imageUrl}
            position={participant.imagePosition}
            alt={participant.name}
            className="size-10 shrink-0"
          />

          <div className="col min-w-0 gap-0.5">
            <span className="truncate font-medium">{participant.name}</span>
            {participant.label && <span className="text-faint text-xxs truncate font-mono">{participant.label}</span>}
          </div>
        </div>
      </TableCell>

      <TableCell className="max-md:hidden">
        <div className="row flex-wrap gap-1">
          {participant.styles.map((style) => (
            <Chip key={style}>{style}</Chip>
          ))}
        </div>
      </TableCell>

      <TableCell>
        <div className="row items-center justify-end gap-1">
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
      </TableCell>
    </TableRow>
  );
}

function ParticipantDrawer({ tenant, participants }: { tenant: TenantSummary; participants: Participant[] }) {
  const { create, edit: editId } = useSearch({ from });
  const drawer = useDrawer(create !== undefined || editId !== undefined);

  const navigate = useNavigate({ from });
  const onClosed = () => navigate({ search: ({ create, edit, ...prev }) => prev, replace: true });

  return (
    <Drawer {...drawer} onClosed={onClosed} title={create ? 'New person or band' : 'Edit person or band'}>
      <ParticipantForm
        tenant={tenant}
        defaultValue={editId ? participants.find(has('id', editId)) : undefined}
        onClose={drawer.onClose}
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

  const form = useAppForm({
    defaultValues: toFormValues(defaultValue),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: async ({ value, formApi }) => {
      const input = toInput(value);

      const saved = await submitToApi(formApi, () => {
        if (!defaultValue) {
          return createMutation.mutateAsync(input);
        }

        return updateMutation.mutateAsync([defaultValue.id, input]);
      });

      if (saved) {
        onClose();
      }
    },
  });

  return (
    <Form form={form} className="col min-h-0 flex-1">
      <div className="col min-h-0 flex-1 gap-6 overflow-y-auto p-4">
        <form.AppField name="name">
          {({ InputField }) => <InputField label="Name" placeholder="Johnny Purple" />}
        </form.AppField>

        <form.AppField
          name="imageUrl"
          listeners={{ onChange: () => form.setFieldValue('imagePosition', { x: 50, y: 50 }) }}
        >
          {({ FileField }) => (
            <FileField
              tenantId={tenant.id}
              label="Picture"
              hint="Drag it to set what stays in frame once cropped."
              renderThumbnail={(url) =>
                url === null ? (
                  <Thumbnail className="size-24 shrink-0" />
                ) : (
                  <form.AppField name="imagePosition">
                    {({ ImagePositionField }) => <ImagePositionField url={url} className="size-24 shrink-0" />}
                  </form.AppField>
                )
              }
            />
          )}
        </form.AppField>

        <div className="grid gap-6 sm:grid-cols-2">
          <form.AppField name="label">
            {({ InputField }) => <InputField label="Label" hint="Artists only." placeholder="Trip Records" />}
          </form.AppField>

          <form.AppField name="origin">
            {({ InputField }) => <InputField label="Origin" hint="Artists only." placeholder="Berlin" />}
          </form.AppField>
        </div>

        <form.AppField name="styles" mode="array">
          {({ ArrayField }) => (
            <ArrayField label="Styles" add="Add a style" newItem="">
              {(index) => (
                <form.AppField name={`styles[${index}]`}>
                  {({ InputField }) => <InputField placeholder="e.g. techno" />}
                </form.AppField>
              )}
            </ArrayField>
          )}
        </form.AppField>

        <form.AppField name="description">
          {({ TextareaField }) => <TextareaField label="Description" rows={6} />}
        </form.AppField>

        <form.AppField name="socialLinks" mode="array">
          {({ ArrayField }) => (
            <ArrayField label="Links" add="Add a link" newItem="">
              {(index) => (
                <form.AppField name={`socialLinks[${index}]`}>
                  {({ InputField }) => <InputField type="url" placeholder="https://" />}
                </form.AppField>
              )}
            </ArrayField>
          )}
        </form.AppField>
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <SubmitButton className="flex-1">{!defaultValue ? 'Add person' : 'Save changes'}</SubmitButton>
      </div>
    </Form>
  );
}

const schema = z.object({
  name: z.string().check(z.minLength(1, 'A name is required.')),
  imageUrl: z.nullable(z.string()),
  imagePosition: z.object({ x: z.number(), y: z.number() }),
  label: z.string(),
  origin: z.string(),
  description: z.string(),
  styles: z.array(z.string()),
  socialLinks: z.array(
    z.union([
      z.literal(''),
      z.url({ protocol: /^https?$/, error: 'Enter a full URL, starting with http:// or https://' }),
    ]),
  ),
});

function toFormValues(participant?: Participant) {
  return {
    name: participant?.name ?? '',
    imageUrl: participant?.imageUrl ?? null,
    imagePosition: participant?.imagePosition ?? { x: 50, y: 50 },
    label: participant?.label ?? '',
    origin: participant?.origin ?? '',
    description: participant?.description ?? '',
    styles: participant?.styles ?? [],
    socialLinks: participant?.socialLinks ?? [],
  };
}

function toInput(values: z.infer<typeof schema>): ParticipantInput {
  return {
    name: values.name,
    description: values.description,
    imageUrl: values.imageUrl,
    imagePosition: values.imagePosition,
    origin: values.origin,
    label: values.label,
    styles: values.styles.filter((value) => value.trim() !== ''),
    socialLinks: values.socialLinks.filter((value) => value.trim() !== ''),
  };
}
