import type { BootstrapResponse, Location, Participant, Session } from '@festivapp/contracts';
import { defined, get, unique } from '@festivapp/utils';
import { useQuery } from '@tanstack/react-query';

import { formatDayKey, formatDayLabel, formatTime } from './datetime.ts';
import { sessionStyles } from './session.ts';

export type ResolvedSession = Session & {
  location: Location;
  participants: Participant[];
  day: string;
  startTime: string;
  endTime: string;
};

export type Day = {
  day: string;
  label: string;
};

export function useBootstrapQuery() {
  return useQuery({
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryKey: ['bootstrap'],
    queryFn: fetchBootstrap,
    select: selectBootstrap,
  });
}

export function useBootstrap() {
  const { data } = useBootstrapQuery();

  if (!data) {
    throw new Error('No bootstrap data');
  }

  return data;
}

async function fetchBootstrap(): Promise<BootstrapResponse> {
  const response = await fetch('/api/bootstrap');

  if (!response.ok) {
    throw new Error(`bootstrap failed: ${response.status}`);
  }

  return (await response.json()) as BootstrapResponse;
}

function selectBootstrap({ tenant, locations, participants, sessions, messages, pushPublicKey }: BootstrapResponse) {
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

  const resolved = sessions.map(resolveSession).toSorted((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    tenant,
    messages,
    pushPublicKey,
    participants,
    locations: locations.toSorted((a, b) => a.position - b.position),
    sessions: resolved,
    days: selectDays(resolved, tenant.timezone),
    styles: selectStyles(resolved),
  };

  function resolveSession(session: Session): ResolvedSession {
    return {
      ...session,
      location: defined(locationById.get(session.locationId)),
      participants: session.participantIds.map((id) => defined(participantsById.get(id))),
      day: formatDayKey(session.startsAt, tenant.timezone),
      startTime: formatTime(session.startsAt, tenant.timezone),
      endTime: formatTime(session.endsAt, tenant.timezone),
    };
  }
}

function selectDays(sessions: ResolvedSession[], timeZone: string): Day[] {
  // label a day from one of its sessions' startsAt: a day key parsed back as UTC
  // midnight lands on the previous day west of Greenwich
  const labels = new Map<string, string>();

  for (const session of sessions) {
    if (!labels.has(session.day)) {
      labels.set(session.day, formatDayLabel(session.startsAt, timeZone));
    }
  }

  return Array.from(labels, ([day, label]) => ({ day, label }));
}

function selectStyles(sessions: ResolvedSession[]): string[] {
  const counts = new Map<string, number>();

  for (const session of sessions) {
    // a style counts once per session, however many of its artists carry it
    for (const style of unique(sessionStyles(session))) {
      counts.set(style, (counts.get(style) ?? 0) + 1);
    }
  }

  return Array.from(counts)
    .toSorted(([, a], [, b]) => b - a)
    .map(get(0));
}

export function useTenant() {
  return useBootstrap().tenant;
}

export function useMessages() {
  return useBootstrap().messages;
}

export function usePushPublicKey() {
  return useBootstrap().pushPublicKey;
}
