import { Form } from '@base-ui/react/form';
import type { Tenant, TenantInput } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '../components/button.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Combobox } from '../components/form/combobox.tsx';
import { Field } from '../components/form/field.tsx';
import { Input } from '../components/form/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { Section } from '../components/section.tsx';
import { api, ApiError } from '../lib/api.ts';
import { parseValidationError } from '../lib/errors.ts';
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

type FormValues = {
  name: string;
  domain: string;
  timezone: string;
};

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
    },
  });

  const errors = useMemo(() => {
    if (ApiError.is(mutation.error, 409)) {
      return { domain: 'Another festival already uses this domain.' };
    }

    return parseValidationError(mutation.error);
  }, [mutation.error]);

  const save = (values: FormValues) => {
    mutation.mutate(values, { onSuccess: () => toast.success('Settings saved') });
  };

  const handleSubmit = (values: FormValues) => {
    if (values.domain === tenant.domain) {
      return save(values);
    }

    confirm({
      title: 'Move the festival to a new address?',
      description: `Attendees will have to visit ${values.domain}; ${tenant.domain} stops working as soon as you save. Bookmarks and installed apps pointing at the old address break.`,
      confirmLabel: 'Move festival',
      onConfirm: () => save(values),
    });
  };

  return (
    <Form errors={errors} onFormSubmit={handleSubmit} className="col gap-8">
      <Section
        title="Festival"
        description="The name attendees see, and the time zone every start and end time in the schedule is read in."
      >
        <div className="col gap-4">
          <Field name="name" label="Name" errors={[{ match: 'valueMissing', message: 'A festival name is required.' }]}>
            <Input required maxLength={100} defaultValue={tenant.name} />
          </Field>

          <Field
            name="timezone"
            label="Time zone"
            hint="Times are entered and shown in this zone, whatever the attendee's device says."
          >
            <Combobox items={timezones} defaultValue={tenant.timezone} placeholder="e.g. Europe/Paris" />
          </Field>
        </div>
      </Section>

      <Section title="App URL" description="The URL of the attendees web application.">
        <Field
          name="domain"
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
          errors={[{ match: 'valueMissing', message: 'A domain is required.' }]}
        >
          <Input required maxLength={253} defaultValue={tenant.domain} className="font-mono" />
        </Field>
      </Section>

      <div className="row border-t pt-6">
        <Button type="submit" disabled={mutation.isPending}>
          Save settings
        </Button>
      </div>
    </Form>
  );
}
