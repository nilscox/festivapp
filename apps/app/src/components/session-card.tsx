import type { Session } from "@festivapp/contracts";
import { Link } from "@tanstack/react-router";
import { formatTime } from "../lib/datetime.ts";
import { formatSessionType, sessionTitle } from "../lib/session.ts";

type SessionCardProps = {
  session: Session;
  locationName: string;
  timeZone: string;
};

export function SessionCard({ session, locationName, timeZone }: SessionCardProps) {
  return (
    <Link
      to="/session/$sessionId"
      params={{ sessionId: session.id }}
      className="flex flex-col gap-1 border-t border-line py-3.5"
    >
      <span className="font-mono text-xs text-muted tabular-nums">
        {formatTime(session.startsAt, timeZone)}–{formatTime(session.endsAt, timeZone)}
      </span>

      <span className="font-display text-lg leading-tight font-semibold">
        {sessionTitle(session)}
      </span>

      <span className="flex items-center gap-2 font-mono text-xs text-muted">
        <span>{locationName}</span>
        <span className="text-accent/70 uppercase">{formatSessionType(session.type)}</span>
      </span>
    </Link>
  );
}
