import type { TenantSummary, TenantTheme } from '@festivapp/contracts';
import { contrastRatio } from '@festivapp/utils';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { toast } from 'react-hot-toast';
import * as z from 'zod/mini';

import { Form, SubmitButton, useAppForm } from '../components/form/form.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { Section } from '../components/section.tsx';
import { api } from '../lib/api.ts';
import { submitToApi } from '../lib/errors.ts';
import { getThemeOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/theme';
const minimumContrast = 4.5;

export function Theme() {
  const { tenant } = useRouteContext({ from });
  const query = useQuery(getThemeOptions(tenant.id));

  return (
    <Page header={<PageHeader eyebrow={tenant.name} title="Theme" />}>
      <QueryBoundary query={query}>{(theme) => <ThemeForm tenant={tenant} theme={theme} />}</QueryBoundary>
    </Page>
  );
}

function ThemeForm({ tenant, theme }: { tenant: TenantSummary; theme: TenantTheme }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (theme: TenantTheme) => api.put<TenantTheme>(`/admin/tenants/${tenant.id}/theme`, theme),
    onSuccess: async () => {
      await queryClient.invalidateQueries(getThemeOptions(tenant.id));
      toast.success('Theme saved');
    },
  });

  const form = useAppForm({
    defaultValues: toFormValues(theme),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value, formApi }) => submitToApi(formApi, () => mutation.mutateAsync(toTheme(value))),
  });

  return (
    <Form form={form} className="col gap-8">
      <Section
        title="Colors"
        description="Everything else — surfaces, text, borders — is shaded from the background, so these two are the whole palette."
      >
        <div className="col gap-4 sm:max-w-100">
          <form.AppField name="backgroundColor">{({ ColorField }) => <ColorField label="Background" />}</form.AppField>

          <form.AppField name="accentColor">{({ ColorField }) => <ColorField label="Accent" />}</form.AppField>
        </div>
      </Section>

      <Section title="Fonts" description="CSS font stacks, used as-is. Uploading font files comes later.">
        <div className="col gap-4">
          <form.AppField name="display">
            {({ InputField }) => <InputField label="Display (headings)" className="font-mono text-xs" />}
          </form.AppField>

          <form.AppField name="body">
            {({ InputField }) => <InputField label="Body" className="font-mono text-xs" />}
          </form.AppField>

          <form.AppField name="mono">
            {({ InputField }) => <InputField label="Labels and times" className="font-mono text-xs" />}
          </form.AppField>
        </div>
      </Section>

      <Section title="Logo" description="Pick an image you have uploaded, or upload one on the spot.">
        <div className="col gap-4">
          <form.AppField name="wordmarkUrl">
            {({ FileField }) => (
              <FileField tenantId={tenant.id} label="Wordmark" hint="Shown in the app header, in place of the name." />
            )}
          </form.AppField>

          <form.AppField name="iconUrl">
            {({ FileField }) => (
              <FileField tenantId={tenant.id} label="Square icon" hint="Used as the install icon and the favicon." />
            )}
          </form.AppField>
        </div>
      </Section>

      <Section title="Background image" description="Sits behind the whole app, dimmed into the background color.">
        <div className="col gap-4">
          <form.AppField name="backgroundImageUrl">
            {({ FileField }) => <FileField tenantId={tenant.id} label="Image" />}
          </form.AppField>

          <form.Subscribe selector={(state) => state.values.backgroundImageUrl === null}>
            {(noImage) => (
              <form.AppField name="backgroundImageOpacity">
                {({ RangeField }) => (
                  <RangeField label="Opacity" min={0} max={1} step={0.01} disabled={noImage} className="max-w-sm" />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </div>
      </Section>

      <Section title="Installed app" description="How the app names itself once added to a home screen.">
        <div className="col gap-4">
          <form.AppField name="pwaName">
            {({ InputField }) => (
              <InputField label="Name" hint={`Defaults to ${tenant.name}.`} maxLength={60} placeholder={tenant.name} />
            )}
          </form.AppField>

          <form.AppField name="pwaShortName">
            {({ InputField }) => (
              <InputField
                label="Short name"
                hint="Shown under the icon. Keep it under 12 characters."
                maxLength={12}
                placeholder={tenant.name}
              />
            )}
          </form.AppField>
        </div>
      </Section>

      <Section
        title="Custom CSS"
        description="Appended after the app's own styles, so it wins ties. Attendees load it offline, so avoid @import and anything hosted elsewhere."
      >
        <form.AppField name="customCss">
          {({ TextareaField }) => (
            <TextareaField
              label="Stylesheet"
              hint="Up to 20,000 characters."
              rows={12}
              maxLength={20_000}
              placeholder={[
                '.app-background {',
                '  background-size: auto;',
                '  background-repeat: no-repeat;',
                '  background-position: right;',
                '}',
              ].join('\n')}
              spellCheck={false}
              className="font-mono text-xs"
            />
          )}
        </form.AppField>
      </Section>

      <div className="row border-t pt-6">
        <SubmitButton>Save theme</SubmitButton>
      </div>
    </Form>
  );
}

const schema = z
  .object({
    backgroundColor: z.string(),
    accentColor: z.string(),
    display: z.string().check(z.minLength(1, 'A display font stack is required.')),
    body: z.string().check(z.minLength(1, 'A body font stack is required.')),
    mono: z.string().check(z.minLength(1, 'A mono font stack is required.')),
    wordmarkUrl: z.nullable(z.string()),
    iconUrl: z.nullable(z.string()),
    backgroundImageUrl: z.nullable(z.string()),
    backgroundImageOpacity: z.number(),
    pwaName: z.string(),
    pwaShortName: z.string(),
    customCss: z.string(),
  })
  .check((ctx) => {
    const contrast = contrastRatio(ctx.value.backgroundColor, ctx.value.accentColor);

    if (contrast < minimumContrast) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value,
        path: ['accentColor'],
        message: `Too close to the background (${contrast.toFixed(1)}:1, needs ${minimumContrast}:1).`,
      });
    }
  });

function toFormValues(theme: TenantTheme) {
  return {
    backgroundColor: theme.backgroundColor,
    accentColor: theme.accentColor,
    display: theme.fonts.display,
    body: theme.fonts.body,
    mono: theme.fonts.mono,
    wordmarkUrl: theme.logo.wordmarkUrl,
    iconUrl: theme.logo.iconUrl,
    backgroundImageUrl: theme.backgroundImage?.url ?? null,
    backgroundImageOpacity: theme.backgroundImage?.opacity ?? 0.2,
    pwaName: theme.pwa.name ?? '',
    pwaShortName: theme.pwa.shortName ?? '',
    customCss: theme.customCss ?? '',
  };
}

function toTheme(values: ReturnType<typeof toFormValues>): TenantTheme {
  return {
    backgroundColor: values.backgroundColor,
    accentColor: values.accentColor,
    fonts: {
      display: values.display,
      body: values.body,
      mono: values.mono,
    },
    logo: {
      wordmarkUrl: values.wordmarkUrl,
      iconUrl: values.iconUrl,
    },
    backgroundImage: values.backgroundImageUrl
      ? { url: values.backgroundImageUrl, opacity: values.backgroundImageOpacity }
      : null,
    customCss: values.customCss,
    pwa: {
      name: values.pwaName,
      shortName: values.pwaShortName,
    },
  };
}
