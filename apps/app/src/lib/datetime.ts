import { formatInTimeZone } from 'date-fns-tz';

export function formatTime(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'HH:mm');
}

export function formatDayKey(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
}

export function formatDayLabel(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'EEEE dd');
}

export function formatNowHeading(now: Date, timeZone: string): string {
  return formatInTimeZone(now, timeZone, 'EEEE dd, HH:mm');
}

export function formatMessageDate(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'EEEE dd MMM, HH:mm');
}

export function countdownLabel(from: Date, iso: string): string {
  const diffMs = new Date(iso).getTime() - from.getTime();

  if (diffMs <= 0) {
    return 'now';
  }

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days >= 1) {
    return `in ${days}d`;
  }

  if (hours >= 1) {
    const restMinutes = minutes % 60;

    return restMinutes > 0 ? `in ${hours}h ${restMinutes}m` : `in ${hours}h`;
  }

  return `in ${minutes}m`;
}
