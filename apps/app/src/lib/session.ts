import type { SessionType } from '@festivapp/contracts';
import { defined } from '@festivapp/utils';

import type { ResolvedSession } from './bootstrap';

export function formatSessionType(type: SessionType): string {
  return {
    dj_set: 'DJ Set',
    live: 'Live',
    talk: 'Talk',
    workshop: 'Workshop',
    other: 'Other',
  }[type];
}

export function isMusicSession(type: SessionType): boolean {
  return type === 'dj_set' || type === 'live';
}

export function sessionTitle(session: ResolvedSession): string | null {
  if (session.title) {
    return session.title;
  }

  if (isMusicSession(session.type) && session.participants.length === 1) {
    return defined(session.participants[0]).name;
  }

  return null;
}

export function sessionImageUrl(session: ResolvedSession): string | null {
  if (isMusicSession(session.type) && session.participants.length === 1 && session.participants[0]?.imageUrl) {
    return session.participants[0].imageUrl;
  }

  return null;
}

export function sessionListMeta(session: ResolvedSession): string | null {
  if (isMusicSession(session.type) && session.participants.length === 1) {
    return defined(session.participants[0]).styles.join(' / ');
  }

  if (session.type === 'talk' || session.type === 'workshop') {
    return sessionSubhead(session);
  }

  return null;
}

export function sessionSubhead(session: ResolvedSession): string | null {
  const names = session.participants.map((participant) => participant.name).join(', ');

  if (session.type === 'talk') {
    return `Talk by ${names}`;
  }

  if (session.type === 'workshop') {
    return `Facilitated by ${names}`;
  }

  return null;
}
