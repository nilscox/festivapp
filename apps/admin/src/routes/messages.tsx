import { Form } from '@base-ui/react/form';
import type { Message, MessageInput, MessageUpdate, Tenant, TenantSummary, TenantTheme } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Bell, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { Checkbox } from '../components/checkbox.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer, useDrawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Field } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { SearchSummary } from '../components/search.tsx';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../components/table.tsx';
import { Textarea } from '../components/textarea.tsx';
import { api } from '../lib/api.ts';
import { parseValidationError } from '../lib/errors.ts';
import { getTenantOptions, getThemeOptions, listMessagesOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/messages';

type FormValues = {
  title: string;
  body: string;
  notify?: boolean;
};

export function Messages() {
  const { tenant } = useRouteContext({ from });

  const tenantQuery = useQuery(getTenantOptions(tenant.id));
  const themeQuery = useQuery(getThemeOptions(tenant.id));
  const messagesQuery = useQuery(listMessagesOptions(tenant.id));

  return (
    <Page header={<Header tenant={tenant} showCreate={Boolean(messagesQuery.data?.length)} />}>
      <QueryBoundary query={[tenantQuery, themeQuery, messagesQuery]}>
        {(tenant, theme, messages) => (
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

            <MessageDrawer tenant={tenant} theme={theme} messages={messages} />
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
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenant.id}/messages/${id}`),
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
          <TableHeaderCell className="w-44 max-md:hidden">Published</TableHeaderCell>
          <TableHeaderCell>Message</TableHeaderCell>
          <TableHeaderCell className="w-32 text-end!">Actions</TableHeaderCell>
        </TableHeader>

        <TableBody>
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} onDelete={() => onDelete(message)} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MessageItem({ message, onDelete }: { message: Message; onDelete: () => void }) {
  return (
    <TableRow>
      <TableCell className="text-faint font-mono text-xs whitespace-nowrap max-md:hidden">
        {format(new Date(message.createdAt), 'd MMM yyyy, HH:mm')}
      </TableCell>

      <TableCell>
        <div className="truncate font-medium">{message.title}</div>
        <div className="text-muted max-w-lg truncate text-xs">{message.body}</div>
      </TableCell>

      <TableCell>
        <div className="row items-center justify-end gap-1">
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
      </TableCell>
    </TableRow>
  );
}

function MessageDrawer({ tenant, theme, messages }: { tenant: Tenant; theme: TenantTheme; messages: Message[] }) {
  const { create, edit: editId } = useSearch({ from });
  const drawer = useDrawer(create !== undefined || editId !== undefined);

  const navigate = useNavigate({ from });
  const onClosed = () => navigate({ search: ({ create, edit, ...prev }) => prev, replace: true });

  return (
    <Drawer {...drawer} onClosed={onClosed} title={create ? 'New message' : 'Edit message'}>
      <MessageForm
        tenant={tenant}
        theme={theme}
        defaultValue={editId ? messages.find(has('id', editId)) : undefined}
        onClose={drawer.onClose}
      />
    </Drawer>
  );
}

function MessageForm({
  tenant,
  theme,
  defaultValue,
  onClose,
}: {
  tenant: Tenant;
  theme: TenantTheme;
  defaultValue?: Message;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries(listMessagesOptions(tenant.id));

  const createMutation = useMutation({
    mutationFn: (input: MessageInput) => api.post<Message>(`/admin/tenants/${tenant.id}/messages`, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ([id, input]: [id: string, input: MessageUpdate]) =>
      api.patch<Message>(`/admin/tenants/${tenant.id}/messages/${id}`, input),
    onSuccess: invalidate,
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    return parseValidationError(createMutation.error ?? updateMutation.error);
  }, [createMutation.error, updateMutation.error]);

  const confirm = useConfirmDialog();

  const confirmNotify = (values: FormValues) => {
    confirm({
      title: 'Send notification',
      description: (
        <>
          <div className="mb-4">
            A push notification will be sent to {tenant.registeredSubscriptions} device
            {tenant.registeredSubscriptions === 1 ? '' : 's'}.
          </div>
          <NotificationPreview theme={theme} title={values.title} body={values.body} />
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
      if (values.notify && tenant.registeredSubscriptions > 0) {
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

function NotificationPreview({ theme, title, body }: { theme: TenantTheme; title: string; body: string }) {
  return (
    <div className="row bg-subtle text-ink items-start gap-2 rounded-xl border p-3 shadow-md">
      <div
        className="bg-accent row size-8 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: theme?.backgroundColor, color: theme?.accentColor }}
      >
        {theme.logo.iconUrl ? (
          <img src={theme.logo.iconUrl} alt="" className="size-6 object-contain" />
        ) : (
          <Bell className="size-4" />
        )}
      </div>

      <div className="col min-w-0 flex-1 gap-1">
        <div className="text-base font-semibold tracking-tight">{title}</div>
        <div className="text-muted text-sm leading-snug whitespace-pre-wrap">{body}</div>
      </div>
    </div>
  );
}
