import { createRoute, Link } from "@tanstack/react-router";
import { formatDayLabel, formatTime } from "../lib/datetime.ts";
import { useBootstrap } from "../use-bootstrap.ts";
import { rootRoute } from "./root.tsx";

function SessionDetail() {
  const query = useBootstrap();
  const { sessionId } = sessionRoute.useParams();
  const data = query.data;

  if (!data) {
    return null;
  }

  const { tenant, stages, categories, sessions } = data;
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

  const stage = stages.find((item) => item.id === session.stageId);
  const category = session.categoryId
    ? categories.find((item) => item.id === session.categoryId)
    : undefined;

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
          {session.title}
        </h1>

        <span className="flex items-center gap-2 font-mono text-sm text-muted">
          {stage ? <span>{stage.name}</span> : null}
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
      </div>

      {session.description ? (
        <p className="max-w-prose text-base leading-normal text-ink-soft">{session.description}</p>
      ) : null}
    </div>
  );
}

export const sessionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session/$sessionId",
  component: SessionDetail,
});
