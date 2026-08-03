import type { Location, Participant, Session } from '@festivapp/contracts';
import { matchesSearch } from '@festivapp/utils';

import { formatDayKey, formatDayLabel } from './datetime.ts';

export type ScheduleSession = Session & {
  displayName: string;
  location: Location;
  participants: Participant[];
  overlaps: ScheduleSession[];
  matches: (search: string) => boolean;
};

export type ScheduleDay = {
  key: string;
  label: string;
  sessions: ScheduleSession[];
};

export function groupByDay(sessions: ScheduleSession[], timeZone: string): ScheduleDay[] {
  const days = new Map<string, ScheduleDay>();

  for (const session of sessions.toSorted((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = formatDayKey(session.startsAt, timeZone);
    const day = days.get(key);

    if (day) {
      day.sessions.push(session);
    } else {
      days.set(key, { key, label: formatDayLabel(session.startsAt, timeZone), sessions: [session] });
    }
  }

  return Array.from(days.values());
}

export function getScheduleSessions(
  sessions: Session[],
  locations: Location[],
  participants: Participant[],
): ScheduleSession[] {
  const locationsById = new Map(locations.map((location) => [location.id, location]));
  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

  // A cached session outlives the location or the participant a delete cascaded away, so drop what no longer resolves
  // rather than throw the page away until the next refetch.
  const resolved: ScheduleSession[] = sessions.flatMap((session) => {
    const location = locationsById.get(session.locationId);

    if (!location) {
      return [];
    }

    const participants = session.participantIds
      .map((participantId) => participantsById.get(participantId))
      .filter((participant) => participant !== undefined);

    const participantNames = participants.map((participant) => participant.name);

    const matchItems = [session.title, location.name, ...participantNames];

    return {
      ...session,
      displayName: session.title ?? (participantNames.join(', ') || '—'),
      location,
      participants,
      overlaps: [],
      matches: (search: string) => matchesSearch(search, ...matchItems),
    };
  });

  for (const [index, session] of resolved.entries()) {
    for (const other of resolved.slice(index + 1)) {
      if (session.locationId !== other.locationId) {
        continue;
      }

      if (session.startsAt < other.endsAt && other.startsAt < session.endsAt) {
        session.overlaps.push(other);
        other.overlaps.push(session);
      }
    }
  }

  return resolved;
}
