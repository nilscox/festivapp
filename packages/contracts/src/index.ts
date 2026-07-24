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
export type Location = {
  id: string;
  name: string;
  /** Sort order among the tenant's locations. */
  position: number;
};

/** The kind of a session; governs which participant role it can carry. */
export type SessionType = 'live' | 'dj_set' | 'talk' | 'workshop' | 'other';

/** A link to a participant's presence on an external platform. */
export type SocialLink = {
  /** Platform key (e.g. "instagram", "spotify", "website"). */
  platform: string;
  url: string;
};

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
  socialLinks: SocialLink[];
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
