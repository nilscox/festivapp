export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function formatDayLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

export function formatNowHeading(now: Date, timeZone: string): string {
  const iso = now.toISOString();
  const weekday = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
  }).format(now);

  return `${weekday}, ${formatTime(iso, timeZone)}`;
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
