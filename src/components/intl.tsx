import { IntlShape, useIntl } from '@cookbook/solid-intl';
import { Show } from 'solid-js';

type FormattedDateProps = {
  date?: string | Date;
  options?: Intl.DateTimeFormatOptions;
};

export function FormattedDate(props: FormattedDateProps) {
  return (
    <Show when={props.date}>
      {(date) => <>{Intl.DateTimeFormat(undefined, props.options).format(new Date(date()))}</>}
    </Show>
  );
}

export function ArtistDate(props: { date?: string | Date }) {
  return (
    <FormattedDate date={props.date} options={{ weekday: 'long', hour: 'numeric', minute: 'numeric' }} />
  );
}

export function Translate(props: { id: string; values?: Parameters<IntlShape['formatMessage']>[1] }) {
  const intl = useIntl();

  return <>{intl.formatMessage({ id: props.id }, props.values)}</>;
}
