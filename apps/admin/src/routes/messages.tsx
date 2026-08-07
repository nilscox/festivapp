import type { Message, MessageInput, MessageUpdate, Tenant, TenantSummary, TenantTheme } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import { format } from 'date-fns';
import { Bell, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import * as z from 'zod/mini';

import { Button, IconButton, LinkButton } from '../components/button.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Drawer, useDrawer } from '../components/drawer.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Form, SubmitButton, useAppForm } from '../components/form/form.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { SearchSummary } from '../components/search.tsx';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../components/table.tsx';
import { api } from '../lib/api.ts';
import { submitToApi } from '../lib/errors.ts';
import { getTenantOptions, getThemeOptions, listMessagesOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/messages';

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

  const confirm = useConfirmDialog();

  const confirmNotify = (value: z.infer<typeof schema>, publish: () => Promise<boolean>) => {
    confirm({
      title: 'Send notification',
      description: (
        <NotificationPreview
          theme={theme}
          devices={tenant.registeredSubscriptions}
          title={value.title}
          body={value.body}
        />
      ),
      confirmLabel: 'Send',
      confirmVariant: 'primary',
      onConfirm: async () => {
        if (await publish()) {
          onClose();
        }
      },
    });
  };

  const form = useAppForm({
    defaultValues: {
      title: defaultValue?.title ?? '',
      body: defaultValue?.body ?? '',
      notify: true,
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: async ({ value, formApi }) => {
      const publish = () => {
        return submitToApi(formApi, () => {
          if (defaultValue) {
            return updateMutation.mutateAsync([defaultValue.id, { title: value.title, body: value.body }]);
          }

          return createMutation.mutateAsync(value);
        });
      };

      if (!defaultValue && value.notify && tenant.registeredSubscriptions > 0) {
        return confirmNotify(value, publish);
      }

      if (await publish()) {
        onClose();
      }
    },
  });

  return (
    <Form form={form} className="col flex-1">
      <div className="col flex-1 gap-6 overflow-y-auto p-4">
        <form.AppField name="title">
          {({ InputField }) => <InputField label="Title" placeholder="e.g. Main stage delayed" />}
        </form.AppField>

        <form.AppField name="body">
          {({ TextareaField }) => (
            <TextareaField label="Message" rows={6} placeholder="What do attendees need to know?" />
          )}
        </form.AppField>

        {!defaultValue && (
          <form.AppField name="notify">
            {({ CheckboxField }) => (
              <CheckboxField
                label="Send a notification"
                hint="Reaches every attendee who opted in. It cannot be sent again later, and editing the message does not resend it."
              />
            )}
          </form.AppField>
        )}
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <SubmitButton className="flex-1">{!defaultValue ? 'Publish' : 'Save changes'}</SubmitButton>
      </div>
    </Form>
  );
}

const schema = z.object({
  title: z.string().check(z.minLength(1, 'A title is required.')),
  body: z.string().check(z.minLength(1, 'A message is required.')),
  notify: z.boolean(),
});

function NotificationPreview({
  theme,
  devices,
  title,
  body,
}: {
  theme: TenantTheme;
  devices: number;
  title: string;
  body: string;
}) {
  return (
    <>
      <div className="mb-4">
        A push notification will be sent to {devices} device{devices === 1 ? '' : 's'}.
      </div>

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
    </>
  );
}
