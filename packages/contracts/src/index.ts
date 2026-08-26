/**
 * A tenant's visual identity. The organizer picks two colors; the rest of the
 * palette is derived from them at runtime by the attendee app.
 */
export type TenantTheme = {
  /**
   * Base background. Surfaces, text and borders are shaded from it with
   * `color-mix`, its luminance decides whether ink comes out dark or light, and
   * it doubles as the PWA `theme_color`.
   */
  backgroundColor: string;
  /**
   * Brand color, used for headings, icons and highlights. The backoffice
   * refuses to save a pair below 4.5:1 against the background; the API does not
   * enforce it, so seeded and CLI-written themes can go below.
   */
  accentColor: string;
  fonts: TenantFonts;
  logo: TenantLogo;
  backgroundImage: TenantBackgroundImage | null;
  pwa: TenantPwa;
  /**
   * Stylesheet appended after the app's own styles, so it wins ties. Applies to
   * the attendee app only. Attendees load it offline, so it must not `@import`
   * or reference anything the app hasn't cached.
   */
  customCss: string | null;
};

/** CSS font stacks, used as-is (e.g. "'Space Grotesk', system-ui, sans-serif"). */
export type TenantFonts = {
  display: string;
  body: string;
  mono: string;
};

export type TenantLogo = {
  /** Wide mark shown in the app header in place of the festival name. */
  wordmarkUrl: string | null;
  /** Square mark used as the install icon and the favicon. */
  iconUrl: string | null;
};

export type TenantBackgroundImage = {
  url: string;
  /** How strongly the image shows through, from 0 to 1. */
  opacity: number;
};

/** Identity of the installed app; both fall back to the tenant's name when null. */
export type TenantPwa = {
  name: string | null;
  /** Shown under the home-screen icon, so keep it under ~12 characters. */
  shortName: string | null;
};

export type TenantConfig = {
  id: string;
  name: string;
  /** The exact host that resolves to this tenant (e.g. "coolfest.localhost"). */
  domain: string;
  /** IANA timezone every schedule time is read in, whatever the device says. */
  timezone: string;
  /** Path of the map image (see `UploadedFile.url`), or null for no map. */
  mapUrl: string | null;
  theme: TenantTheme;
};

/** A place where sessions happen (a stage, tent, room, …). */
export type Location = {
  id: string;
  name: string;
  description: string | null;
  /** Sort order among the tenant's locations. */
  position: number;
  mapPin: MapPin;
  hideOnBreak: boolean;
};

/**
 * Where a location is drawn on the tenant's map image.
 *
 * `x`/`y` are percentages of the image's own width and height from its
 * top-left corner, not of the rendered element, so they hold at any size — as
 * long as the map is drawn whole and undistorted (`object-fit: contain`, never
 * `cover`).
 */
export type MapPin = {
  x: number;
  y: number;
  /** Side of the pin the name label sits on, to keep labels off the artwork. */
  labelPosition: MapPinLabelPosition;
};

export type MapPinLabelPosition = 'top' | 'bottom' | 'left' | 'right';

export type SessionType = 'live' | 'dj_set' | 'talk' | 'workshop' | 'other';

/** An act on the line-up: a person or a band, a speaker, or a facilitator. */
export type Participant = {
  id: string;
  name: string;
  description: string | null;
  /** Path of an uploaded file (see `UploadedFile.url`), or null for no image. */
  imageUrl: string | null;
  imagePosition: ImagePosition;
  /** Where the act is from. Musical acts only; null otherwise. */
  origin: string | null;
  /** Record label. Musical acts only; null otherwise. */
  label: string | null;
  /** Musical styles/genres. Musical acts only; empty otherwise. */
  styles: string[];
  /** URLs of the act's presence elsewhere; the platform is derived from the host. */
  socialLinks: string[];
};

/**
 * Focal point of an image, as percentages of its own width and height from its
 * top-left corner. It is the point that stays in frame wherever the image is
 * cropped to fill its box (`object-fit: cover`), so it holds at any size and
 * aspect ratio. 50/50 is the browser's own default, centered.
 */
export type ImagePosition = {
  x: number;
  y: number;
};

/** A scheduled item in the timetable. */
export type Session = {
  id: string;
  locationId: string;
  type: SessionType;
  /**
   * Explicit title, or null when the session has none. The attendee app then
   * falls back to the participant's name, but only for a session with exactly
   * one of them — the server never fills this in.
   */
  title: string | null;
  /**
   * Null falls back to the participant's own description, but only for a
   * session with exactly one of them; with several the app shows nothing.
   */
  description: string | null;
  /** Participants on this session, in presentation order. */
  participantIds: string[];
  /** ISO 8601 string. */
  startsAt: string;
  /** ISO 8601 string. */
  endsAt: string;
};

/** An announcement published by the organizers, shown on the app's info page. */
export type Message = {
  id: string;
  title: string;
  body: string;
  /** ISO 8601 string. Also the publication time — a message is live on creation. */
  createdAt: string;
};

/**
 * Body of `POST` and `DELETE` on `/push/subscriptions`, matching what
 * `PushSubscription.toJSON()` returns.
 */
export type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

/**
 * Payload of `GET /bootstrap`: everything a freshly-loaded attendee SPA needs
 * to render the whole festival and keep it offline. There is no second read
 * endpoint.
 */
export type BootstrapResponse = {
  tenant: TenantConfig;
  locations: Location[];
  participants: Participant[];
  sessions: Session[];
  /** Newest first. */
  messages: Message[];
  /**
   * VAPID public key to subscribe a device with, or null when the deployment
   * has no keys configured — push is off then, and the app must not offer it.
   */
  pushPublicKey: string | null;
};

/* Organizer backoffice (`/admin/*`) contracts. */

/** An authenticated backoffice user. Accounts are global, spanning festivals. */
export type Organizer = {
  id: string;
  email: string;
  /** Display name, or null when unset (the UI falls back to the email). */
  name: string | null;
};

/** A festival the signed-in organizer may manage. */
export type Tenant = {
  id: string;
  name: string;
  /** The exact host that resolves to this tenant (e.g. "coolfest.localhost"). */
  domain: string;
  /** IANA timezone every schedule time is read in. */
  timezone: string;
  /** Path of the map image (see `UploadedFile.url`), or null for no map. */
  mapUrl: string | null;
  registeredSubscriptions: number;
};

export type TenantSummary = Pick<Tenant, 'id' | 'name' | 'domain'>;

export type LoginRequest = {
  email: string;
  password: string;
};

/** Payload of `GET /admin/auth/me`, and the response to a successful login. */
export type MeResponse = {
  organizer: Organizer;
  tenants: TenantSummary[];
};

/**
 * Body of `PATCH /admin/tenants/:tenantId`. It may carry any subset of these
 * keys; the ones it omits keep their value. Changing `domain` moves the
 * attendee app: the previous host stops resolving as soon as it is saved, and a
 * host another festival already uses is rejected with `409 domain_taken`.
 */
export type TenantInput = {
  name: string;
  domain: string;
  timezone: string;
  /** Path of an uploaded file (see `UploadedFile.url`), or null for no map. */
  mapUrl: string | null;
};

/**
 * Body of `POST /admin/tenants/:tenantId/locations`. A new location lands at
 * the centre of the map with its label underneath and is placed from the map
 * page afterwards, so the pin is not part of this body.
 */
export type LocationInput = {
  name: string;
  description: string | null;
  position: number;
  hideOnBreak: boolean;
};

/**
 * Body of `PATCH /admin/tenants/:tenantId/locations/:id`. It may carry any
 * subset of these keys; the ones it omits keep their value.
 */
export type LocationUpdate = Partial<LocationInput> & {
  mapPin?: {
    x: number;
    y: number;
    /** Omit to keep the current one, so moving a pin need not echo it back. */
    labelPosition?: MapPinLabelPosition;
  };
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
  /** Omit to center the image, which is also what a new picture resets it to. */
  imagePosition?: ImagePosition;
  origin: string | null;
  label: string | null;
  styles: string[];
  socialLinks: string[];
};

/**
 * Body of `POST /admin/tenants/:tenantId/sessions` and of the `PUT` on one of
 * them, which replaces the session whole — there is no partial update. A session
 * must carry a title unless it has exactly one participant: that is the only
 * case the attendee app titles a session after somebody, so with nobody — or
 * with several — there is nothing to fall back to and the card renders blank.
 */
export type SessionInput = {
  locationId: string;
  type: SessionType;
  title: string | null;
  description: string | null;
  /** Participants on this session, in presentation order. */
  participantIds: string[];
  /** ISO 8601 string. */
  startsAt: string;
  /** ISO 8601 string. Must be after `startsAt`. */
  endsAt: string;
};

/**
 * Body of `POST /admin/tenants/:tenantId/messages`. The message is published as
 * soon as it is created; `notify` decides whether that also pushes it to every
 * subscribed device.
 */
export type MessageInput = {
  title: string;
  body: string;
  notify?: boolean;
};

/**
 * Body of `PATCH /admin/tenants/:tenantId/messages/:id`. It may carry any
 * subset of these keys; the ones it omits keep their value. Editing never
 * notifies again — `notify` is not part of it.
 */
export type MessageUpdate = Partial<Omit<MessageInput, 'notify'>>;

/**
 * An asset the organizer uploaded for a tenant. Uploads go to
 * `POST /admin/tenants/:tenantId/files` with the raw bytes as the request body
 * and the media type as `Content-Type` — no multipart; the optional `?name=`
 * query keeps the original file name.
 */
export type UploadedFile = {
  id: string;
  /** Name the file was uploaded under, or null when the client sent none. */
  name: string | null;
  contentType: string;
  /** Size in bytes. */
  size: number;
  /**
   * Path the file is served from. Always same-origin and immutable, so it can
   * be stored in a theme and cached offline by the attendee app.
   */
  url: string;
  /** ISO 8601 string. */
  createdAt: string;
};
