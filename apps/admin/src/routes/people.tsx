import { Form } from '@base-ui/react/form';
import type { Participant, ParticipantInput, TenantSummary } from '@festivapp/contracts';
import { matchesSearch } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { Pencil, Plus, SearchX, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Field } from '../components/field.tsx';
import { FileInput } from '../components/file-input.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { SearchInput } from '../components/search-input.tsx';
import { Spinner } from '../components/spinner.tsx';
import { Table, TableHeader, TableHeaderCell } from '../components/table.tsx';
import { Textarea } from '../components/textarea.tsx';
import { Thumbnail } from '../components/thumbnail.tsx';
import { parseValidationError } from '../lib/errors.ts';
import {
  createParticipantOptions,
  deleteParticipantOptions,
  listParticipantsOptions,
  updateParticipantOptions,
} from '../lib/participants.ts';
import { getThemeOptions } from '../lib/theme.ts';

const from = '/festivals/$tenantId/people';

type FormValues = {
  name: string;
  origin: string;
  label: string;
  description: string;
};

type Row = { key: string; value: string };

export function People() {
  const { tenant } = useRouteContext({ from });

  const { isPending, isError, isSuccess, data, error } = useQuery(listParticipantsOptions(tenant.id));
  const participants = data ?? [];

  return (
    <Page header={<Header tenant={tenant} showCreate={participants.length > 0} />}>
      {isPending && <Spinner className="mx-auto my-8 size-6" />}

      {isError && <>Error: {error.message}</>}

      {isSuccess && (
        <>
          {participants.length === 0 ? (
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
          ) : (
            <PeopleList tenant={tenant} participants={participants} />
          )}

          <ParticipantDrawer tenant={tenant} participants={participants} />
        </>
      )}
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
    ...deleteParticipantOptions(tenant.id),
    onSuccess: () => queryClient.invalidateQueries(listParticipantsOptions(tenant.id)),
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

  const { search = '' } = useSearch({ from });
  const navigate = useNavigate({ from });

  const onSearch = (value: string) => {
    navigate({ search: (prev) => ({ ...prev, search: value || undefined }), replace: true });
  };

  const matching = useMemo(() => {
    return participants.filter((participant) => {
      return matchesSearch(search, participant.name, participant.label, participant.origin, ...participant.styles);
    });
  }, [participants, search]);

  return (
    <div className="reveal">
      <SearchInput
        value={search}
        onValueChange={onSearch}
        placeholder="Search by name, label, origin or style"
        className="mb-4 md:max-w-96"
      />

      <p className="text-muted mb-3 font-mono text-xs tracking-wide">
        {search === '' ? (
          <>
            {participants.length} {participants.length === 1 ? 'person' : 'people'} &bull; listed alphabetically
          </>
        ) : (
          <>
            {matching.length} of {participants.length} &bull; matching "{search}"
          </>
        )}
      </p>

      {matching.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nobody matches that"
          description="No one on the line-up matches this search. Try a shorter or different term."
          cta={
            <Button variant="secondary" onClick={() => onSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
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
          <span key={style} className="bg-subtle text-muted truncate rounded-md px-2 py-1 font-mono text-xs">
            {style}
          </span>
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
        defaultValue={editId ? participants.find((participant) => participant.id === editId) : undefined}
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

  const createMutation = useMutation({ ...createParticipantOptions(tenant.id), onSuccess: invalidate });
  const updateMutation = useMutation({ ...updateParticipantOptions(tenant.id), onSuccess: invalidate });

  const [imageUrl, setImageUrl] = useState(defaultValue?.imageUrl ?? null);
  const [styles, setStyles] = useState<Row[]>(() => (defaultValue?.styles ?? []).map(toRow));
  const [socialLinks, setSocialLinks] = useState<Row[]>(() => (defaultValue?.socialLinks ?? []).map(toRow));

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
      styles: styles.map((style) => style.value.trim()).filter(Boolean),
      socialLinks: socialLinks.map((link) => link.value.trim()).filter(Boolean),
    };

    if (!defaultValue) {
      createMutation.mutate(input, { onSuccess: onClose });
    } else {
      updateMutation.mutate({ id: defaultValue.id, ...input }, { onSuccess: onClose });
    }
  };

  return (
    <Form onFormSubmit={handleSubmit} className="col min-h-0 flex-1">
      <div className="col min-h-0 flex-1 gap-6 overflow-y-auto p-4">
        <Field
          name="name"
          label="Name"
          errors={[{ match: 'valueMissing', message: 'A name is required.' }]}
          error={errors?.name?.errors[0]}
        >
          <Input required defaultValue={defaultValue?.name} placeholder="Johnny Purple" />
        </Field>

        <Field label="Picture" hint="Shown on the session's page in the app.">
          <FileInput tenantId={tenant.id} value={imageUrl} onValueChange={setImageUrl} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="label" label="Label" hint="Artists only." error={errors?.label?.errors[0]}>
            <Input defaultValue={defaultValue?.label ?? ''} placeholder="Trip Records" />
          </Field>

          <Field name="origin" label="Origin" hint="Artists only." error={errors?.origin?.errors[0]}>
            <Input defaultValue={defaultValue?.origin ?? ''} placeholder="Berlin" />
          </Field>
        </div>

        <StylesEditor styles={styles} onChange={setStyles} error={errors?.styles?.errors[0]} />

        <Field name="description" label="Description" error={errors?.description?.errors[0]}>
          <Textarea rows={6} defaultValue={defaultValue?.description ?? ''} />
        </Field>

        <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} error={errors?.socialLinks?.errors[0]} />
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

function StylesEditor({
  styles,
  onChange,
  error,
}: {
  styles: Row[];
  onChange: (styles: Row[]) => void;
  error?: React.ReactNode;
}) {
  return (
    <fieldset className="col gap-2">
      <legend className="text-muted text-label mb-1 font-medium">Styles</legend>

      {styles.map((style) => (
        <div key={style.key} className="row items-start gap-2">
          <div className="min-w-0 flex-1">
            <Field>
              <Input
                value={style.value}
                onChange={(event) => {
                  const value = event.currentTarget.value;

                  onChange(styles.map((current) => (current.key === style.key ? { ...current, value } : current)));
                }}
                placeholder="e.g. techno"
              />
            </Field>
          </div>

          <IconButton
            icon={Trash2}
            variant="ghost"
            aria-label={`Remove ${style.value || 'style'}`}
            onClick={() => onChange(styles.filter((current) => current.key !== style.key))}
            className="hover:text-danger mt-1.5"
          />
        </div>
      ))}

      {error && <div className="text-danger-ink text-xs">{error}</div>}

      <Button variant="secondary" size="sm" className="mr-auto" onClick={() => onChange([...styles, toRow('')])}>
        <Plus className="size-3" />
        Add a style
      </Button>
    </fieldset>
  );
}

function SocialLinksEditor({
  links,
  onChange,
  error,
}: {
  links: Row[];
  onChange: (links: Row[]) => void;
  error?: React.ReactNode;
}) {
  return (
    <fieldset className="col gap-2">
      <legend className="text-muted text-label mb-1 font-medium">Links</legend>

      {links.map((link) => (
        <div key={link.key} className="row items-start gap-2">
          <div className="min-w-0 flex-1">
            <Field errors={[{ match: 'typeMismatch', message: 'Enter a full URL, starting with https://' }]}>
              <Input
                type="url"
                value={link.value}
                onChange={(event) => {
                  const value = event.currentTarget.value;

                  onChange(links.map((current) => (current.key === link.key ? { ...current, value } : current)));
                }}
                placeholder="https://"
              />
            </Field>
          </div>

          <IconButton
            icon={Trash2}
            variant="ghost"
            aria-label={`Remove ${link.value || 'link'}`}
            onClick={() => onChange(links.filter((current) => current.key !== link.key))}
            className="hover:text-danger mt-1.5"
          />
        </div>
      ))}

      {error && <div className="text-danger-ink text-xs">{error}</div>}

      <Button variant="secondary" size="sm" className="mr-auto" onClick={() => onChange([...links, toRow('')])}>
        <Plus className="size-3" />
        Add a link
      </Button>
    </fieldset>
  );
}

function toRow(value: string): Row {
  return { value, key: crypto.randomUUID() };
}
