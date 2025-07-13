import { useIntl } from '@cookbook/solid-intl';
import { differenceInMinutes } from 'date-fns';
import type fr from 'lang/fr.json';

type Values = Parameters<ReturnType<typeof useIntl>['formatMessage']>[1];

export function Translate(props: { id: keyof typeof fr; values?: Values }) {
  const intl = useIntl();

  return <>{intl.formatMessage({ id: props.id }, props.values)}</>;
}

export function FormatDate(props: { date: string | Date; format?: string } & Intl.DateTimeFormatOptions) {
  const intl = useIntl();

  return <>{intl.formatDate(props.date, { format: props.format, ...props })}</>;
}

export function FormatRelativeTime(
  props: { a: string | Date; b: string | Date; format?: string } & Intl.DateTimeFormatOptions,
) {
  const intl = useIntl();

  const params = (minutes: number): Parameters<typeof intl.formatRelativeTime> => {
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

  return <>{intl.formatRelativeTime(...params(differenceInMinutes(props.b, props.a)))}</>;
}
