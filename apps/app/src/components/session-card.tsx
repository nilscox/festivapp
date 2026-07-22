import type { Category, Session } from "@festivapp/contracts";
import { Link } from "@tanstack/react-router";
import { formatTime } from "../lib/datetime.ts";

type SessionCardProps = {
  session: Session;
  stageName: string;
  category: Category | undefined;
  timeZone: string;
};

export function SessionCard({ session, stageName, category, timeZone }: SessionCardProps) {
  return (
    <Link
      to="/session/$sessionId"
      params={{ sessionId: session.id }}
      className="flex flex-col gap-1 border-t border-line py-3.5"
    >
      <span className="font-mono text-xs text-muted tabular-nums">
        {formatTime(session.startsAt, timeZone)}–{formatTime(session.endsAt, timeZone)}
      </span>

      <span className="font-display text-lg leading-tight font-semibold">{session.title}</span>

      <span className="flex items-center gap-2 font-mono text-xs text-muted">
        <span>{stageName}</span>
        {category ? (
          <span className="inline-flex items-center gap-1">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: category.color ?? "currentColor" }}
              aria-hidden="true"
            />
            {category.name}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
