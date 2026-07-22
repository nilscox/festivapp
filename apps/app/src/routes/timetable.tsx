import { createRoute, Link } from "@tanstack/react-router";
import { SessionCard } from "../components/session-card.tsx";
import { dayKey, formatDayLabel } from "../lib/datetime.ts";
import { useBootstrap } from "../use-bootstrap.ts";
import { rootRoute } from "./root.tsx";

type View = "agenda" | "stages";

type TimetableSearch = {
  day?: string;
  view?: View;
  category?: string;
};

function pill(active: boolean): string {
  const base = "rounded-full border px-3 py-1 font-mono text-xs";
  return active ? `${base} border-accent text-ink` : `${base} border-line text-muted`;
}

function Timetable() {
  const query = useBootstrap();
  const search = timetableRoute.useSearch();
  const data = query.data;

  if (!data) {
    return null;
  }

  const { tenant, stages, categories, sessions } = data;
  const tz = tenant.timezone;
  const view = search.view ?? "agenda";

  const stageById = new Map(stages.map((stage) => [stage.id, stage]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const dayIsoByKey = new Map<string, string>();
  for (const session of sessions) {
    const key = dayKey(session.startsAt, tz);

    if (!dayIsoByKey.has(key)) {
      dayIsoByKey.set(key, session.startsAt);
    }
  }

  const days = [...dayIsoByKey.keys()].toSorted();
  const firstDay = days[0];

  if (firstDay === undefined) {
    return <p className="py-8 text-center text-sm text-muted">The line-up is on its way.</p>;
  }

  const selectedDay = search.day && days.includes(search.day) ? search.day : firstDay;

  const visible = sessions.filter(
    (session) =>
      dayKey(session.startsAt, tz) === selectedDay &&
      (search.category === undefined || session.categoryId === search.category),
  );

  const stagesWithSessions = stages.filter((stage) =>
    visible.some((session) => session.stageId === stage.id),
  );

  return (
    <div className="reveal flex flex-1 flex-col gap-5 pb-8">
      <nav className="flex gap-4 border-b border-line">
        {days.map((day) => (
          <Link
            key={day}
            to="/"
            search={{ day, view, category: search.category }}
            className={`-mb-px border-b-2 pb-2 font-mono text-xs tracking-wider uppercase ${
              day === selectedDay ? "border-accent text-ink" : "border-transparent text-muted"
            }`}
          >
            {formatDayLabel(dayIsoByKey.get(day) ?? day, tz)}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 uppercase">
          {(["agenda", "stages"] as const).map((option) => (
            <Link
              key={option}
              to="/"
              search={{ day: selectedDay, view: option, category: search.category }}
              className={pill(option === view)}
            >
              {option}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            search={{ day: selectedDay, view, category: undefined }}
            className={pill(search.category === undefined)}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              to="/"
              search={{ day: selectedDay, view, category: category.id }}
              className={pill(search.category === category.id)}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Nothing scheduled here yet.</p>
      ) : view === "stages" ? (
        <div className="flex flex-col gap-6">
          {stagesWithSessions.map((stage) => (
            <section key={stage.id} className="flex flex-col">
              <h2 className="pb-1 font-mono text-xs tracking-widest text-accent/70 uppercase">
                {stage.name}
              </h2>
              {visible
                .filter((session) => session.stageId === stage.id)
                .map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    stageName={stage.name}
                    category={session.categoryId ? categoryById.get(session.categoryId) : undefined}
                    timeZone={tz}
                  />
                ))}
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {visible.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              stageName={stageById.get(session.stageId)?.name ?? ""}
              category={session.categoryId ? categoryById.get(session.categoryId) : undefined}
              timeZone={tz}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const timetableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): TimetableSearch => ({
    day: typeof search.day === "string" ? search.day : undefined,
    view: search.view === "stages" || search.view === "agenda" ? search.view : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  component: Timetable,
});
