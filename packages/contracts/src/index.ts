/**
 * Shared API contracts between the FestivApp backend and its SPA clients.
 *
 * This package is intentionally type-only: every export is erased at runtime,
 * so it can be imported with `import type` and never ships any JavaScript.
 */

/**
 * A tenant's visual identity. Colors are the only two the organizer picks: the
 * rest of the palette (surfaces, text, borders) is derived from them, and the
 * backoffice rejects a pair that doesn't contrast enough.
 */
export type TenantTheme = {
  /**
   * Base background, as a CSS color string. Surfaces and the page behind them
   * are shaded from it, it doubles as the browser/status bar `theme-color`, and
   * its luminance decides whether text comes out dark or light.
   */
  backgroundColor: string;
  /** Brand color, used for headings, icons and highlights. */
  accentColor: string;
  fonts: TenantFonts;
  logo: TenantLogo;
  /** Image layered over `backgroundColor`, or null when unset. */
  backgroundImage: TenantBackgroundImage | null;
  /** Identity of the installed app, independent of the festival's full name. */
  pwa: TenantPwa;
  /**
   * Stylesheet appended after the app's own styles, or null when unset. Applies
   * only to the attendee app. Since attendees may load it offline, it should not
   * `@import` or reference anything the app hasn't cached.
   */
  customCss: string | null;
};

/** CSS font stacks, used as-is (e.g. "'Space Grotesk', system-ui, sans-serif"). */
export type TenantFonts = {
  /** Headings and other display type. */
  display: string;
  /** Body copy. */
  body: string;
  /** Labels, chips and times. */
  mono: string;
};

export type TenantLogo = {
  /** Wide wordmark shown in the app's header, or null when unset. */
  wordmarkUrl: string | null;
  /** Square mark used as the install icon and favicon, or null when unset. */
  iconUrl: string | null;
};

export type TenantBackgroundImage = {
  url: string;
  /** How strongly the image shows through, from 0 to 1. */
  opacity: number;
};

export type TenantPwa = {
  /** Name of the installed app; falls back to the tenant's name when unset. */
  name: string | null;
  /** Short name shown under the home-screen icon (~12 characters). */
  shortName: string | null;
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
export type Location = {
  id: string;
  name: string;
  /** Sort order among the tenant's locations. */
  position: number;
};

/** The kind of a session; governs which participant role it can carry. */
export type SessionType = 'live' | 'dj_set' | 'talk' | 'workshop' | 'other';

/** An act on the line-up: a person or a band, a speaker, or a facilitator. */
export type Participant = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  /** Where the act is from. Artist role only; null otherwise. */
  origin: string | null;
  /** Record label. Artist role only; null otherwise. */
  label: string | null;
  /** Musical styles/genres. Artist role only; empty otherwise. */
  styles: string[];
  /** URLs of the act's presence elsewhere; the platform is derived from the host. */
  socialLinks: string[];
};

/** A scheduled item in the timetable. */
export type Session = {
  id: string;
  locationId: string;
  type: SessionType;
  /**
   * Display title. Null when the session has none and no fallback applies;
   * for a single-artist `dj_set`/`live`, the server fills this with the
   * artist's name.
   */
  title: string | null;
  /** Display description, with the same single-artist fallback as `title`. */
  description: string | null;
  /** Participants on this session, in presentation order. */
  participantIds: string[];
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
  locations: Location[];
  participants: Participant[];
  sessions: Session[];
};

/* Organizer backoffice (`/admin/*`) contracts. */

/** An authenticated backoffice user. Accounts are global, spanning festivals. */
export type Organizer = {
  id: string;
  email: string;
  /** Display name, or null when unset (the UI falls back to the email). */
  name: string | null;
};

/** A festival the signed-in organizer may manage, for the sidebar switcher. */
export type Tenant = {
  id: string;
  name: string;
  /** The exact host that resolves to this tenant (e.g. "coolfest.localhost"). */
  domain: string;
  /** IANA timezone the festival runs in (e.g. "Europe/Paris"). */
  timezone: string;
};

export type TenantSummary = Pick<Tenant, 'id' | 'name' | 'domain'>;

/** Body of `POST /admin/auth/login`. */
export type LoginRequest = {
  email: string;
  password: string;
};

/** Payload of `GET /admin/auth/me` and the response to a successful login. */
export type MeResponse = {
  organizer: Organizer;
  tenants: TenantSummary[];
};

/**
 * Body of `PUT /admin/tenants/:tenantId`. Changing `domain` moves the
 * attendee app: the previous host stops resolving as soon as it is saved, and a
 * host another festival already uses is rejected with `409 domain_taken`.
 */
export type TenantInput = {
  name: string;
  domain: string;
  timezone: string;
};

/** Body of `POST`/`PATCH` on `/admin/tenants/:tenantId/locations`. */
export type LocationInput = {
  name: string;
  position: number;
};

/**
 * Body of `POST`/`PATCH` on `/admin/tenants/:tenantId/participants`. A `PATCH`
 * may carry any subset of these keys; the ones it omits keep their value.
 */
export type ParticipantInput = {
  name: string;
  description: string | null;
  /** Path of an uploaded file (see `UploadedFile.url`), or null for no image. */
  imageUrl: string | null;
  origin: string | null;
  label: string | null;
  styles: string[];
  socialLinks: string[];
};

/**
 * An asset the organizer uploaded for a tenant — a logo, a background image,
 * later an artist picture. Uploads go to `POST /admin/tenants/:tenantId/files`
 * with the raw bytes as the request body and the file's media type as
 * `Content-Type`; the optional `?name=` query keeps the original file name.
 */
export type UploadedFile = {
  id: string;
  /** Name the file was uploaded under, or null when the client sent none. */
  name: string | null;
  /** Media type the file is stored and served with. */
  contentType: string;
  /** Size in bytes. */
  size: number;
  /**
   * Path the file is served from. Always same-origin and immutable, so it can
   * be stored in a theme and cached offline by the attendee app.
   */
  url: string;
  /** Upload time as an ISO 8601 string. */
  createdAt: string;
};
