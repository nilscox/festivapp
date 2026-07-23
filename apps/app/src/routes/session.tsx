import type { Participant } from "@festivapp/contracts";
import { createRoute, Link } from "@tanstack/react-router";
import { formatDayLabel, formatTime } from "../lib/datetime.ts";
import { formatSessionType, participantsHeading, sessionTitle } from "../lib/session.ts";
import { useBootstrap } from "../use-bootstrap.ts";
import { rootRoute } from "./root.tsx";

function ParticipantEntry({ participant }: { participant: Participant }) {
  const meta = [participant.origin, ...participant.styles, participant.label].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <div className="flex flex-col gap-1 border-t border-line py-3.5">
      <span className="font-display text-lg leading-tight font-semibold">{participant.name}</span>

      {meta.length > 0 ? (
        <span className="font-mono text-xs text-muted">{meta.join(" · ")}</span>
      ) : null}

      {participant.description ? (
        <p className="max-w-prose text-sm leading-normal text-ink-soft">
          {participant.description}
        </p>
      ) : null}

      {participant.socialLinks.length > 0 ? (
        <span className="flex flex-wrap gap-3 pt-0.5">
          {participant.socialLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs tracking-wider text-accent uppercase"
            >
              {link.platform}
            </a>
          ))}
        </span>
      ) : null}
    </div>
  );
}

function SessionDetail() {
  const query = useBootstrap();
  const { sessionId } = sessionRoute.useParams();
  const data = query.data;

  if (!data) {
    return null;
  }

  const { tenant, locations, participants, sessions } = data;
  const tz = tenant.timezone;
  const session = sessions.find((item) => item.id === sessionId);

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8 text-center">
        <p className="text-sm text-muted">This session isn't in the line-up.</p>
        <Link to="/" className="font-mono text-xs tracking-wider text-accent uppercase">
          Back to timetable
        </Link>
      </div>
    );
  }

  const location = locations.find((item) => item.id === session.locationId);
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const lineup = session.participantIds
    .map((id) => participantById.get(id))
    .filter((participant): participant is Participant => participant !== undefined);

  return (
    <div className="reveal flex flex-1 flex-col gap-6 py-2">
      <Link to="/" className="font-mono text-xs tracking-wider text-muted uppercase">
        Back to timetable
      </Link>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-widest text-accent/70 uppercase">
          {formatDayLabel(session.startsAt, tz)} · {formatTime(session.startsAt, tz)}–
          {formatTime(session.endsAt, tz)}
        </span>

        <h1 className="font-display text-3xl leading-tight font-extrabold tracking-tight">
          {sessionTitle(session)}
        </h1>

        <span className="flex items-center gap-2 font-mono text-sm text-muted">
          {location ? <span>{location.name}</span> : null}
          <span className="text-accent/70 uppercase">{formatSessionType(session.type)}</span>
        </span>
      </div>

      {session.description ? (
        <p className="max-w-prose text-base leading-normal text-ink-soft">{session.description}</p>
      ) : null}

      {lineup.length > 0 ? (
        <section className="flex flex-col">
          <h2 className="pb-1 font-mono text-xs tracking-widest text-accent/70 uppercase">
            {participantsHeading(session.type, lineup.length)}
          </h2>
          {lineup.map((participant) => (
            <ParticipantEntry key={participant.id} participant={participant} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

export const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session/$sessionId",
  component: SessionDetail,
});
