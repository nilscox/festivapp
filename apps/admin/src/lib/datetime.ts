import { formatInTimeZone } from 'date-fns-tz';

export function formatTime(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'HH:mm');
}

export function formatDayKey(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
}

export function formatDayLabel(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'EEE dd MMM yyyy').toUpperCase();
}
