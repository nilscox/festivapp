/**
 * Shared API contracts between the FestivApp backend and its SPA clients.
 *
 * This package is intentionally type-only: every export is erased at runtime,
 * so it can be imported with `import type` and never ships any JavaScript.
 */

export type TenantTheme = {
  /** Primary brand color, as a CSS color string. */
  primaryColor: string;
  /** Absolute or app-relative URL to the tenant's logo, or null when unset. */
  logoUrl: string | null;
};

export type TenantConfig = {
  id: string;
  name: string;
  /** The exact host that resolves to this tenant (e.g. "coolfest.localhost"). */
  domain: string;
  /** IANA timezone the festival runs in (e.g. "Europe/Paris"). */
  timezone: string;
  theme: TenantTheme;
};

/** A place where sessions happen (a stage, tent, room, …). */
export type Stage = {
  id: string;
  name: string;
  /** Sort order among the tenant's stages. */
  position: number;
};

/** A track/type of session (band, DJ set, talk, workshop, …). */
export type Category = {
  id: string;
  name: string;
  /** Optional CSS color used to tint the category in the UI. */
  color: string | null;
  /** Sort order among the tenant's categories. */
  position: number;
};

/** A scheduled item in the timetable. */
export type Session = {
  id: string;
  stageId: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  /** Start time as an ISO 8601 string. */
  startsAt: string;
  /** End time as an ISO 8601 string. */
  endsAt: string;
};

/**
 * Payload returned by `GET /bootstrap`: everything a freshly-loaded attendee
 * SPA needs to render the whole festival and cache it offline. `version` lets
 * clients cheaply detect changes.
 */
export type BootstrapResponse = {
  tenant: TenantConfig;
  stages: Stage[];
  categories: Category[];
  sessions: Session[];
  /** Opaque version marker for the tenant's data; changes when data changes. */
  version: string;
};
