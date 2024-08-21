import { IntlShape, useIntl } from '@cookbook/solid-intl';
import { differenceInMinutes } from 'date-fns';
import { Show } from 'solid-js';

import { createNow } from '../utils/now';

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

export function DistanceToNow(props: { date?: Date }) {
  const intl = useIntl();
  const now = createNow();

  const params = (date: Date): Parameters<typeof intl.formatRelativeTime> => {
    const minutes = differenceInMinutes(date, now());
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return [minutes, 'minutes'];
    }

    if (hours < 24) {
      return [hours, 'hours'];
    }

    return [days, 'days'];
  };

  return <Show when={props.date}>{(date) => intl.formatRelativeTime(...params(date()))}</Show>;
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
