import { Form } from '@base-ui/react/form';
import type { Tenant } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext, useRouter } from '@tanstack/react-router';
import { useMemo } from 'react';
import toast from 'react-hot-toast';

import { Button } from '../components/button.tsx';
import { Combobox } from '../components/combobox.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { Field } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { Section } from '../components/section.tsx';
import { Spinner } from '../components/spinner.tsx';
import { ApiError } from '../lib/api.ts';
import { getMeOptions } from '../lib/auth.ts';
import { parseValidationError } from '../lib/errors.ts';
import { getTenantOptions, updateTenantOptions } from '../lib/tenant.ts';

const from = '/festivals/$tenantId/settings';

const timezones = Intl.supportedValuesOf('timeZone');

export function Settings() {
  const { tenant } = useRouteContext({ from });
  const query = useQuery(getTenantOptions(tenant.id));

  return (
    <Page header={<PageHeader eyebrow={tenant.name} title="Settings" />}>
      {query.isPending && <Spinner className="mx-auto my-8 size-6" />}
      {query.isError && <>Error: {query.error.message}</>}
      {query.isSuccess && <SettingsForm tenant={query.data} />}
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
    ...updateTenantOptions(tenant.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.refetchQueries(getTenantOptions(tenant.id)),
        queryClient.refetchQueries(getMeOptions()),
      ]);
      await router.invalidate();
    },
  });

  const errors = useMemo(() => parseValidationError(mutation.error), [mutation.error]);

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
    <Form onFormSubmit={handleSubmit} className="reveal col gap-8">
      <Section
        title="Festival"
        description="The name attendees see, and the time zone every start and end time in the schedule is read in."
      >
        <div className="col gap-4">
          <Field
            name="name"
            label="Name"
            errors={[{ match: 'valueMissing', message: 'A festival name is required.' }]}
            error={errors?.name?.errors[0]}
          >
            <Input required maxLength={100} defaultValue={tenant.name} />
          </Field>

          <Field
            name="timezone"
            label="Time zone"
            hint="Times are entered and shown in this zone, whatever the attendee's device says."
            error={errors?.timezone?.errors[0]}
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
          error={
            ApiError.is(mutation.error, 409) ? 'Another festival already uses this domain.' : errors?.domain?.errors[0]
          }
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
