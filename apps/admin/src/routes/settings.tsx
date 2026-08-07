import type { Tenant, TenantInput } from '@festivapp/contracts';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext, useRouter } from '@tanstack/react-router';
import { toast } from 'react-hot-toast';
import * as z from 'zod/mini';

import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Form, SubmitButton, useAppForm } from '../components/form/form.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { Section } from '../components/section.tsx';
import { api, ApiError } from '../lib/api.ts';
import { submitToApi } from '../lib/errors.ts';
import { getMeOptions, getTenantOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/settings';

const timezones = Intl.supportedValuesOf('timeZone');

export function Settings() {
  const { tenant } = useRouteContext({ from });
  const query = useQuery(getTenantOptions(tenant.id));

  return (
    <Page header={<PageHeader eyebrow={tenant.name} title="Settings" />}>
      <QueryBoundary query={query}>{(data) => <SettingsForm tenant={data} />}</QueryBoundary>
    </Page>
  );
}

function SettingsForm({ tenant }: { tenant: Tenant }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const confirm = useConfirmDialog();

  const mutation = useMutation({
    mutationFn: (input: Partial<TenantInput>) => api.patch<Tenant>(`/admin/tenants/${tenant.id}`, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries(getTenantOptions(tenant.id)),
        queryClient.refetchQueries(getMeOptions()),
      ]);
      await router.invalidate();
      toast.success('Settings saved');
    },
  });

  const form = useAppForm({
    defaultValues: { name: tenant.name, timezone: tenant.timezone, domain: tenant.domain },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value, formApi }) => {
      const save = () => {
        return submitToApi(formApi, () => mutation.mutateAsync(value), domainTaken);
      };

      if (value.domain === tenant.domain) {
        return save();
      }

      confirm({
        title: 'Move the festival to a new address?',
        description: `Attendees will have to visit ${value.domain}; ${tenant.domain} stops working as soon as you save. Bookmarks and installed apps pointing at the old address break.`,
        confirmLabel: 'Move festival',
        onConfirm: save,
      });
    },
  });

  return (
    <Form form={form} className="col gap-8">
      <Section
        title="Festival"
        description="The name attendees see, and the time zone every start and end time in the schedule is read in."
      >
        <div className="col gap-4">
          <form.AppField name="name">{({ InputField }) => <InputField label="Name" maxLength={100} />}</form.AppField>

          <form.AppField name="timezone">
            {({ ComboboxField }) => (
              <ComboboxField
                label="Time zone"
                hint="Times are entered and shown in this zone, whatever the attendee's device says."
                items={timezones}
                placeholder="e.g. Europe/Paris"
              />
            )}
          </form.AppField>
        </div>
      </Section>

      <Section title="App URL" description="The URL of the attendees web application.">
        <form.AppField name="domain">
          {({ InputField }) => (
            <InputField
              label="Domain"
              hint={
                <>
                  The app is live at{' '}
                  <a
                    href={`https://${tenant.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent rounded-sm font-mono underline"
                  >
                    {tenant.domain}
                  </a>
                  .
                </>
              }
              maxLength={253}
              className="font-mono"
            />
          )}
        </form.AppField>
      </Section>

      <div className="row border-t pt-6">
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </Form>
  );
}

const schema = z.object({
  name: z.string().check(z.minLength(1, 'A festival name is required.')),
  timezone: z.string(),
  domain: z.string().check(z.minLength(1, 'A domain is required.')),
});

function domainTaken(error: unknown) {
  if (ApiError.is(error, 409)) {
    return { domain: 'Another festival already uses this domain.' };
  }
}
