import type { SessionType } from "@festivapp/contracts";
import { createRoute, Link } from "@tanstack/react-router";
import { SessionCard } from "../components/session-card.tsx";
import { dayKey, formatDayLabel } from "../lib/datetime.ts";
import { formatSessionType } from "../lib/session.ts";
import { useBootstrap } from "../use-bootstrap.ts";
import { rootRoute } from "./root.tsx";

type View = "agenda" | "locations";

type TimetableSearch = {
  day?: string;
  view?: View;
  type?: SessionType;
};

const SESSION_TYPES: SessionType[] = ["dj_set", "live", "talk", "workshop", "other"];

function isSessionType(value: unknown): value is SessionType {
  return typeof value === "string" && (SESSION_TYPES as string[]).includes(value);
}

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

  const { tenant, locations, sessions } = data;
  const tz = tenant.timezone;
  const view = search.view ?? "agenda";

  const locationById = new Map(locations.map((location) => [location.id, location]));

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

  const typesPresent = SESSION_TYPES.filter((type) =>
    sessions.some((session) => session.type === type),
  );

  const visible = sessions.filter(
    (session) =>
      dayKey(session.startsAt, tz) === selectedDay &&
      (search.type === undefined || session.type === search.type),
  );

  const locationsWithSessions = locations.filter((location) =>
    visible.some((session) => session.locationId === location.id),
  );

  return (
    <div className="reveal flex flex-1 flex-col gap-5 pb-8">
      <nav className="flex gap-4 border-b border-line">
        {days.map((day) => (
          <Link
            key={day}
            to="/"
            search={{ day, view, type: search.type }}
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
          {(["agenda", "locations"] as const).map((option) => (
            <Link
              key={option}
              to="/"
              search={{ day: selectedDay, view: option, type: search.type }}
              className={pill(option === view)}
            >
              {option}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/"
            search={{ day: selectedDay, view, type: undefined }}
            className={pill(search.type === undefined)}
          >
            All
          </Link>
          {typesPresent.map((type) => (
            <Link
              key={type}
              to="/"
              search={{ day: selectedDay, view, type }}
              className={pill(search.type === type)}
            >
              {formatSessionType(type)}
            </Link>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Nothing scheduled here yet.</p>
      ) : view === "locations" ? (
        <div className="flex flex-col gap-6">
          {locationsWithSessions.map((location) => (
            <section key={location.id} className="flex flex-col">
              <h2 className="pb-1 font-mono text-xs tracking-widest text-accent/70 uppercase">
                {location.name}
              </h2>
              {visible
                .filter((session) => session.locationId === location.id)
                .map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    locationName={location.name}
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
              locationName={locationById.get(session.locationId)?.name ?? ""}
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
    view: search.view === "locations" || search.view === "agenda" ? search.view : undefined,
    type: isSessionType(search.type) ? search.type : undefined,
  }),
  component: Timetable,
});
