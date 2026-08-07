import { Field as BaseField } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import type { TenantSummary, TenantTheme } from '@festivapp/contracts';
import { contrastRatio } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '../components/button.tsx';
import { Field } from '../components/form/field.tsx';
import { FileInput } from '../components/form/file-input.tsx';
import { Input } from '../components/form/input.tsx';
import { Range } from '../components/form/range.tsx';
import { Textarea } from '../components/form/textarea.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { Section } from '../components/section.tsx';
import { api } from '../lib/api.ts';
import { getThemeOptions } from '../lib/queries.ts';

const from = '/festivals/$tenantId/theme';
const minimumContrast = 4.5;

type FormValues = {
  backgroundColor: string;
  accentColor: string;
  display: string;
  body: string;
  mono: string;
  backgroundImageOpacity: string;
  pwaName: string;
  pwaShortName: string;
  customCss: string;
};

type Images = {
  wordmarkUrl: string | null;
  iconUrl: string | null;
  backgroundImageUrl: string | null;
};

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
    onSuccess: () => queryClient.invalidateQueries(getThemeOptions(tenant.id)),
  });

  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);

  const [images, setImages] = useState<Images>({
    wordmarkUrl: theme.logo.wordmarkUrl,
    iconUrl: theme.logo.iconUrl,
    backgroundImageUrl: theme.backgroundImage?.url ?? null,
  });

  const setImage = (key: keyof Images) => (value: string | null) => {
    setImages((images) => ({ ...images, [key]: value }));
  };

  const contrast = contrastRatio(backgroundColor, accentColor);

  const handleSubmit = (values: FormValues) => {
    if (contrast < minimumContrast) {
      return toast.error('Pick an accent color that contrasts more with the background.');
    }

    mutation.mutate(toTheme(values, images), { onSuccess: () => toast.success('Theme saved') });
  };

  return (
    <Form onFormSubmit={handleSubmit} className="col gap-8">
      <Section
        title="Colors"
        description="Everything else — surfaces, text, borders — is shaded from the background, so these two are the whole palette."
      >
        <div className="col gap-4 sm:max-w-100">
          <ColorField
            name="backgroundColor"
            label="Background"
            value={backgroundColor}
            onValueChange={setBackgroundColor}
          />

          <ColorField
            name="accentColor"
            label="Accent"
            value={accentColor}
            onValueChange={setAccentColor}
            error={
              contrast < minimumContrast &&
              `Too close to the background (${contrast.toFixed(1)}:1, needs ${minimumContrast}:1).`
            }
          />
        </div>
      </Section>

      <Section title="Fonts" description="CSS font stacks, used as-is. Uploading font files comes later.">
        <div className="col gap-4">
          <Field name="display" label="Display (headings)">
            <Input required defaultValue={theme.fonts.display} className="font-mono text-xs" />
          </Field>

          <Field name="body" label="Body">
            <Input required defaultValue={theme.fonts.body} className="font-mono text-xs" />
          </Field>

          <Field name="mono" label="Labels and times">
            <Input required defaultValue={theme.fonts.mono} className="font-mono text-xs" />
          </Field>
        </div>
      </Section>

      <Section title="Logo" description="Pick an image you have uploaded, or upload one on the spot.">
        <div className="col gap-4">
          <Field label="Wordmark" hint="Shown in the app header, in place of the name.">
            <FileInput tenantId={tenant.id} value={images.wordmarkUrl} onValueChange={setImage('wordmarkUrl')} />
          </Field>

          <Field label="Square icon" hint="Used as the install icon and the favicon.">
            <FileInput tenantId={tenant.id} value={images.iconUrl} onValueChange={setImage('iconUrl')} />
          </Field>
        </div>
      </Section>

      <Section title="Background image" description="Sits behind the whole app, dimmed into the background color.">
        <div className="col gap-4">
          <Field label="Image">
            <FileInput
              tenantId={tenant.id}
              value={images.backgroundImageUrl}
              onValueChange={setImage('backgroundImageUrl')}
            />
          </Field>

          <Field name="backgroundImageOpacity" label="Opacity">
            <Range
              min={0}
              max={1}
              step={0.01}
              disabled={images.backgroundImageUrl === null}
              defaultValue={theme.backgroundImage?.opacity ?? 0.2}
              className="max-w-sm"
            />
          </Field>
        </div>
      </Section>

      <Section title="Installed app" description="How the app names itself once added to a home screen.">
        <div className="col gap-4">
          <Field name="pwaName" label="Name" hint={`Defaults to ${tenant.name}.`}>
            <Input maxLength={60} defaultValue={theme.pwa.name ?? ''} placeholder={tenant.name} />
          </Field>

          <Field name="pwaShortName" label="Short name" hint="Shown under the icon. Keep it under 12 characters.">
            <Input maxLength={12} defaultValue={theme.pwa.shortName ?? ''} placeholder={tenant.name} />
          </Field>
        </div>
      </Section>

      <Section
        title="Custom CSS"
        description="Appended after the app's own styles, so it wins ties. Attendees load it offline, so avoid @import and anything hosted elsewhere."
      >
        <Field name="customCss" label="Stylesheet" hint="Up to 20,000 characters.">
          <Textarea
            rows={12}
            maxLength={20_000}
            defaultValue={theme.customCss ?? ''}
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
        </Field>
      </Section>

      <div className="row border-t pt-6">
        <Button type="submit" disabled={mutation.isPending}>
          Save theme
        </Button>
      </div>
    </Form>
  );
}

function toTheme(values: FormValues, images: Images): TenantTheme {
  return {
    backgroundColor: values.backgroundColor,
    accentColor: values.accentColor,
    fonts: {
      display: values.display,
      body: values.body,
      mono: values.mono,
    },
    logo: {
      wordmarkUrl: images.wordmarkUrl,
      iconUrl: images.iconUrl,
    },
    backgroundImage: images.backgroundImageUrl
      ? { url: images.backgroundImageUrl, opacity: Number(values.backgroundImageOpacity) }
      : null,
    customCss: values.customCss,
    pwa: {
      name: values.pwaName,
      shortName: values.pwaShortName,
    },
  };
}

function ColorField({
  name,
  label,
  value,
  onValueChange,
  error,
}: {
  name: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: React.ReactNode;
}) {
  return (
    <Field name={name} label={label} error={error}>
      <div className="row items-center gap-3">
        <BaseField.Control
          type="color"
          value={value}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          className="size-12 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
        />

        <span className="text-muted font-mono text-xs uppercase">{value}</span>
      </div>
    </Field>
  );
}
