import { Field as BaseField } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import type { TenantSummary, TenantTheme } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import { useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '../components/button.tsx';
import { Field } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { Range } from '../components/range.tsx';
import { Spinner } from '../components/spinner.tsx';
import { Textarea } from '../components/textarea.tsx';
import { contrastRatio } from '../lib/colors.ts';
import { getThemeOptions, updateThemeOptions } from '../lib/theme.ts';

const from = '/festivals/$tenantId/theme';
const minimumContrast = 4.5;

type FormValues = {
  backgroundColor: string;
  accentColor: string;
  display: string;
  body: string;
  mono: string;
  wordmarkUrl: string;
  iconUrl: string;
  backgroundImageUrl: string;
  backgroundImageOpacity: string;
  pwaName: string;
  pwaShortName: string;
  customCss: string;
};

export function Theme() {
  const { tenant } = useRouteContext({ from });
  const { isPending, isError, isSuccess, data, error } = useQuery(getThemeOptions(tenant.id));

  return (
    <Page header={<PageHeader eyebrow={tenant.name} title="Theme" />}>
      {isPending && <Spinner className="mx-auto my-8 size-6" />}

      {isError && <>Error: {error.message}</>}

      {isSuccess && <ThemeForm tenant={tenant} theme={data} />}
    </Page>
  );
}

function ThemeForm({ tenant, theme }: { tenant: TenantSummary; theme: TenantTheme }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...updateThemeOptions(tenant.id),
    onSuccess: () => queryClient.invalidateQueries(getThemeOptions(tenant.id)),
  });

  const [backgroundColor, setBackgroundColor] = useState(theme.backgroundColor);
  const [accentColor, setAccentColor] = useState(theme.accentColor);
  const [hasBackgroundImage, setHasBackgroundImage] = useState(theme.backgroundImage !== null);

  const contrast = contrastRatio(backgroundColor, accentColor);

  const handleSubmit = (values: FormValues) => {
    if (contrast < minimumContrast) {
      return toast.error('Pick an accent color that contrasts more with the background.');
    }

    mutation.mutate(toTheme(values), { onSuccess: () => toast.success('Theme saved') });
  };

  const urlPattern = 'https?://\\S+|/\\S*';
  const urlErrors = [{ match: 'patternMismatch' as const, message: 'Enter a full URL, or a path starting with "/".' }];

  return (
    <Form onFormSubmit={handleSubmit} className="reveal col gap-8">
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

      <Section title="Logo" description="Point at images already served on your domain — uploads come later.">
        <div className="col gap-4">
          <Field
            name="wordmarkUrl"
            label="Wordmark"
            hint="Shown in the app header, in place of the name."
            errors={urlErrors}
          >
            <Input
              pattern={urlPattern}
              defaultValue={theme.logo.wordmarkUrl ?? ''}
              placeholder="/uploads/wordmark.svg"
            />
          </Field>

          <Field name="iconUrl" label="Square icon" hint="Used as the install icon and the favicon." errors={urlErrors}>
            <Input pattern={urlPattern} defaultValue={theme.logo.iconUrl ?? ''} placeholder="/uploads/icon.png" />
          </Field>
        </div>
      </Section>

      <Section title="Background image" description="Sits behind the whole app, dimmed into the background color.">
        <div className="col gap-4">
          <Field name="backgroundImageUrl" label="Image URL" errors={urlErrors}>
            <Input
              pattern={urlPattern}
              defaultValue={theme.backgroundImage?.url ?? ''}
              placeholder="/uploads/background.jpg"
              onChange={(event) => setHasBackgroundImage(event.currentTarget.value !== '')}
            />
          </Field>

          <Field name="backgroundImageOpacity" label="Opacity">
            <Range
              min={0}
              max={1}
              step={0.01}
              disabled={!hasBackgroundImage}
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

function toTheme(values: FormValues): TenantTheme {
  const backgroundImageUrl = values.backgroundImageUrl.trim();

  return {
    backgroundColor: values.backgroundColor,
    accentColor: values.accentColor,
    fonts: {
      display: values.display,
      body: values.body,
      mono: values.mono,
    },
    logo: {
      wordmarkUrl: values.wordmarkUrl.trim() || null,
      iconUrl: values.iconUrl.trim() || null,
    },
    backgroundImage: backgroundImageUrl
      ? { url: backgroundImageUrl, opacity: Number(values.backgroundImageOpacity) }
      : null,
    customCss: values.customCss.trim() || null,
    pwa: {
      name: values.pwaName.trim() || null,
      shortName: values.pwaShortName.trim() || null,
    },
  };
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="col gap-4 md:grid md:grid-cols-3 md:gap-8">
      <div className="md:col-span-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted mt-1 text-xs leading-normal">{description}</p>
      </div>

      <div className="col gap-6 md:col-span-2">{children}</div>
    </section>
  );
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
