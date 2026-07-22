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
  theme: TenantTheme;
};

/**
 * Payload returned by `GET /bootstrap`: everything a freshly-loaded attendee
 * SPA needs to render and cache offline. Grows over later milestones to carry
 * the full schedule; `version` lets clients cheaply detect changes.
 */
export type BootstrapResponse = {
  tenant: TenantConfig;
  /** Opaque version marker for the tenant's data; changes when data changes. */
  version: string;
};
