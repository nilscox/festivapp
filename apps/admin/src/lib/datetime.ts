import { addDays, format, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export function formatTime(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'HH:mm');
}

export function formatDayKey(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'yyyy-MM-dd');
}

export function formatDayLabel(date: string, timeZone: string): string {
  return formatInTimeZone(date, timeZone, 'EEE dd MMM yyyy').toUpperCase();
}

export function toInstant(day: string, time: string, timeZone: string): string {
  return fromZonedTime(`${day}T${time}`, timeZone).toISOString();
}

export function nextDay(day: string): string {
  return format(addDays(parseISO(day), 1), 'yyyy-MM-dd');
}
