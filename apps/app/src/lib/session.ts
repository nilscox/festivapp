import type { Session, SessionType } from "@festivapp/contracts";

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  dj_set: "DJ Set",
  live: "Live",
  talk: "Talk",
  workshop: "Workshop",
  other: "Other",
};

export function formatSessionType(type: SessionType): string {
  return SESSION_TYPE_LABELS[type];
}

export function sessionTitle(session: Session): string {
  return session.title ?? formatSessionType(session.type);
}

export function participantsHeading(type: SessionType, count: number): string {
  if (type === "talk") {
    return count === 1 ? "Speaker" : "Speakers";
  }

  if (type === "workshop") {
    return count === 1 ? "Facilitator" : "Facilitators";
  }

  return count === 1 ? "Artist" : "Line-up";
}
