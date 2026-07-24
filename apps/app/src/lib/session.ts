import type { Participant, Session, SessionType } from '@festivapp/contracts';

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  dj_set: 'DJ Set',
  live: 'Live',
  talk: 'Talk',
  workshop: 'Workshop',
  other: 'Other',
};

export function formatSessionType(type: SessionType): string {
  return SESSION_TYPE_LABELS[type];
}

export function isMusicSession(type: SessionType): boolean {
  return type === 'dj_set' || type === 'live';
}

export function sessionTitle(session: Session, participants: Participant[]): string | null {
  if (session.title) {
    return session.title;
  }

  if (isMusicSession(session.type) && session.participantIds.length === 1) {
    return participants[0]!.name;
  }

  return null;
}

export function sessionImageUrl(session: Session, participants: Participant[]): string | null {
  if (isMusicSession(session.type) && participants.length === 1 && participants[0]?.imageUrl) {
    return participants[0].imageUrl;
  }

  return null;
}

export function sessionListMeta(session: Session, participants: Participant[]): string | null {
  if (isMusicSession(session.type) && participants.length === 1) {
    return participants[0]!.styles.join(' / ');
  }

  if (session.type === 'talk' || session.type === 'workshop') {
    return sessionSubhead(session, participants);
  }

  return null;
}

export function sessionSubhead(session: Session, participants: Participant[]): string | null {
  const names = participants.map((participant) => participant.name).join(', ');

  if (session.type === 'talk') {
    return `Talk by ${names}`;
  }

  if (session.type === 'workshop') {
    return `Facilitated by ${names}`;
  }

  return null;
}

export function participantsHeading(type: SessionType, count: number): string {
  if (type === 'talk') {
    return count === 1 ? 'Speaker' : 'Speakers';
  }

  if (type === 'workshop') {
    return count === 1 ? 'Facilitator' : 'Facilitators';
  }

  return count === 1 ? 'Artist' : 'Line-up';
}
