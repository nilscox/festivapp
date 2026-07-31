import { Form } from '@base-ui/react/form';
import type { Message, TenantSummary } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { Checkbox } from '../components/checkbox.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Field } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { SearchSummary } from '../components/search.tsx';
import { Table, TableHeader, TableHeaderCell } from '../components/table.tsx';
import { Textarea } from '../components/textarea.tsx';
import { parseValidationError } from '../lib/errors.ts';
import {
  createMessageOptions,
  deleteMessageOptions,
  listMessagesOptions,
  updateMessageOptions,
} from '../lib/messages.ts';
import { getTenantOptions } from '../lib/tenant.ts';

const from = '/festivals/$tenantId/messages';

type FormValues = {
  title: string;
  body: string;
  notify?: boolean;
};

export function Messages() {
  const { tenant } = useRouteContext({ from });

  const query = useQuery(listMessagesOptions(tenant.id));

  return (
    <Page header={<Header tenant={tenant} showCreate={Boolean(query.data?.length)} />}>
      <QueryBoundary query={query}>
        {(messages) => (
          <>
            {messages.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No messages yet"
                description="Messages are announcements shown on the app's info page. Attendees who opted in get a notification when you publish one."
                cta={
                  <LinkButton from={from} search={{ create: true }}>
                    <Plus className="size-4" />
                    Write a message
                  </LinkButton>
                }
              />
            ) : (
              <MessagesList tenant={tenant} messages={messages} />
            )}

            <MessageDrawer tenant={tenant} messages={messages} />
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
      title="Messages"
      end={
        showCreate && (
          <LinkButton from={from} search={{ create: true }} className="mt-auto">
            <Plus className="size-4" />
            <span className="max-md:hidden">Write a message</span>
          </LinkButton>
        )
      }
    />
  );
}

function MessagesList({ tenant, messages }: { tenant: TenantSummary; messages: Message[] }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    ...deleteMessageOptions(tenant.id),
    onSuccess: () => queryClient.invalidateQueries(listMessagesOptions(tenant.id)),
  });

  const confirm = useConfirmDialog();

  const onDelete = (message: Message) => {
    confirm({
      title: `Delete "${message.title}"?`,
      description:
        "This removes the message from the app. Notifications were already sent to attendees' devices. This can't be undone.",
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutateAsync(message.id),
    });
  };

  return (
    <div className="col gap-4">
      <SearchSummary items={messages} matching={messages} search="">
        {messages.length} message{messages.length === 1 ? '' : 's'} &bull; newest first on the info page
      </SearchSummary>

      <Table>
        <TableHeader>
          <TableHeaderCell className="w-36 max-md:hidden">Published</TableHeaderCell>
          <TableHeaderCell className="flex-1">Message</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableHeader>

        {messages.map((message) => (
          <MessageItem key={message.id} message={message} onDelete={() => onDelete(message)} />
        ))}
      </Table>
    </div>
  );
}

function MessageItem({ message, onDelete }: { message: Message; onDelete: () => void }) {
  return (
    <div className="hover:bg-subtle row items-center gap-3 p-3 md:gap-4 md:px-4">
      <span className="text-faint w-36 shrink-0 font-mono text-xs whitespace-nowrap max-md:hidden">
        {format(new Date(message.createdAt), 'd MMM yyyy, HH:mm')}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{message.title}</div>
        <div className="text-muted max-w-lg truncate text-xs">{message.body}</div>
      </div>

      <div className="row shrink-0 items-center gap-1">
        <LinkButton variant="secondary" size="sm" from={from} search={{ edit: message.id }}>
          <Pencil className="size-3" />
          Edit
        </LinkButton>
        <IconButton
          icon={Trash2}
          variant="ghost"
          aria-label={`Delete ${message.title}`}
          onClick={onDelete}
          className="hover:text-danger"
        />
      </div>
    </div>
  );
}

function MessageDrawer({ tenant, messages }: { tenant: TenantSummary; messages: Message[] }) {
  const { create, edit: editId } = useSearch({ from });
  const open = create !== undefined || editId !== undefined;

  const navigate = useNavigate({ from });
  const onClose = () => navigate({ search: {} });

  return (
    <Drawer open={open} onOpenChange={(open) => !open && onClose()} title={create ? 'New message' : 'Edit message'}>
      <MessageForm
        tenant={tenant}
        defaultValue={editId ? messages.find(has('id', editId)) : undefined}
        onClose={onClose}
      />
    </Drawer>
  );
}

function MessageForm({
  tenant: { id: tenantId },
  defaultValue,
  onClose,
}: {
  tenant: TenantSummary;
  defaultValue?: Message;
  onClose: () => void;
}) {
  const { data: tenant } = useQuery(getTenantOptions(tenantId));
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries(listMessagesOptions(tenantId));

  const createMutation = useMutation({
    ...createMessageOptions(tenantId),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    ...updateMessageOptions(tenantId),
    onSuccess: invalidate,
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    return parseValidationError(createMutation.error ?? updateMutation.error);
  }, [createMutation.error, updateMutation.error]);

  const confirm = useConfirmDialog();

  const confirmNotify = (values: FormValues) => {
    const description = tenant
      ? `A push notification will be sent to ${tenant.registeredSubscriptions} device${tenant.registeredSubscriptions === 1 ? '' : 's'}.`
      : 'A push notification will be sent to every attendee who opted in.';

    confirm({
      title: 'Send notification',
      description: (
        <>
          <div>{description}</div>
          <div className="text-ink mt-2 rounded-md border p-2">
            <div className="text-lg font-semibold tracking-tight">{values.title}</div>
            <div className="leading-relaxed whitespace-pre-wrap">{values.body}</div>
          </div>
        </>
      ),
      confirmLabel: 'Send',
      confirmVariant: 'primary',
      onConfirm: () => createMutation.mutateAsync(values, { onSuccess: onClose }),
    });
  };

  const handleSubmit = (values: FormValues) => {
    if (defaultValue) {
      updateMutation.mutate([defaultValue.id, { title: values.title, body: values.body }], { onSuccess: onClose });
    } else {
      if (values.notify) {
        confirmNotify(values);
      } else {
        createMutation.mutate(values, { onSuccess: onClose });
      }
    }
  };

  return (
    <Form errors={errors} onFormSubmit={handleSubmit} className="col flex-1">
      <div className="col flex-1 gap-6 overflow-y-auto p-4">
        <Field name="title" label="Title" errors={[{ match: 'valueMissing', message: 'A title is required.' }]}>
          <Input required defaultValue={defaultValue?.title} placeholder="e.g. Main stage delayed" />
        </Field>

        <Field name="body" label="Message" errors={[{ match: 'valueMissing', message: 'A message is required.' }]}>
          <Textarea required rows={6} defaultValue={defaultValue?.body} placeholder="What do attendees need to know?" />
        </Field>

        {!defaultValue && (
          <Field name="notify">
            <Checkbox
              name="notify"
              defaultChecked
              label="Send a notification"
              hint="Reaches every attendee who opted in. It cannot be sent again later, and editing the message does not resend it."
            />
          </Field>
        )}
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" className="flex-1" disabled={pending}>
          {!defaultValue ? 'Publish' : 'Save changes'}
        </Button>
      </div>
    </Form>
  );
}
