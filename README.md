# FestivApp

White-label, multi-tenant PWA for festival attendees, with an organizer backoffice.
A tenant (one festival) is resolved from the request's `Host` header.

## Stack

- **API** — Express 5 + Drizzle ORM + Postgres, TypeScript run directly by Node 26
  (native type stripping, no build step).
- **Clients** — Vite + React SPAs (`app` = attendee PWA, `admin` = backoffice,
  `landing`). _Added in later milestones._
- **Monorepo** — pnpm workspaces. Shared, type-only API contracts in
  `packages/contracts`; shared tool configs in `packages/config`.
- **Tooling** — oxlint, oxfmt.

## Layout

```
apps/
  api/         Express API (tenant resolution, /bootstrap)
packages/
  contracts/   Shared, type-only request/response types
  config/      Shared base tsconfig, oxlint and oxfmt configs
```

## Prerequisites

Node ≥ 24, pnpm, and Docker (for local Postgres).

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
```

Start Postgres in a container:

```bash
docker run -d --name festivapp-pg \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -e POSTGRES_DB=festivapp \
  -p 5432:5432 \
  docker.io/postgres:17-alpine
```

Then, from `apps/api`:

```bash
pnpm db:migrate            # apply Drizzle migrations
pnpm seed                  # seed the demo tenant
pnpm dev                   # start the API on http://127.0.0.1:3000
```

Verify:

```bash
curl 127.0.0.1:3000/health
curl -H "Host: coolfest.localhost" 127.0.0.1:3000/bootstrap
```

## Scripts

Run from the repo root (whole workspace):

| Command                     | Description                       |
| --------------------------- | --------------------------------- |
| `pnpm typecheck`            | Typecheck every workspace package |
| `pnpm lint` / `pnpm format` | oxlint / oxfmt                    |
| `pnpm format:check`         | Verify formatting without writing |

Run from `apps/api`:

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `pnpm dev`        | Run the API with `node --watch` |
| `pnpm start`      | Run the API once                |
| `pnpm db:migrate` | Apply pending migrations        |
| `pnpm cli`        | Run the CLI (`pnpm cli --help`) |

## Configuration

Each app has its own `.env` (never committed); required variables have no defaults,
so the process crashes on startup if one is missing. For the API:

| Variable           | Description                             |
| ------------------ | --------------------------------------- |
| `HOST`             | Address the API listens on              |
| `PORT`             | Port the API listens on                 |
| `DATABASE_URL`     | Postgres connection string              |
| `STORAGE_DIR`      | Directory uploaded files are written to |
| `UPLOAD_MAX_BYTES` | Largest accepted upload, in bytes       |

## Tenant resolution

Every public attendee route is tenant-scoped (`/admin` takes its tenant from the
URL instead, and `/files` from the file id). The tenant is matched against
`tenants.domain` using, in order: a `?__tenant=` query param, an `X-Tenant-Domain`
header (both for local/testing convenience), then the real `Host`. Unknown hosts
get a 404.

## File storage

Organizers upload assets (logos, background images) to
`POST /admin/tenants/:tenantId/files` with the raw bytes as the request body and
the media type as `Content-Type` — no multipart. PNG, JPEG, WebP, AVIF and SVG are
accepted; `?name=` keeps the original file name for the backoffice listing.

Bytes go through `src/storage.ts`, a `put`/`read`/`delete` seam whose only
implementation writes under `STORAGE_DIR` (keyed `<tenantId>/<fileId><ext>`); an
object store can replace it without touching the routes. Files are served back
publicly and immutably from `GET /files/:id` — no tenant resolution, so the
backoffice on its own host can preview them, with the file id as the only
capability.

That path is deliberately at the **origin root**, not under the SPAs' `/api`
prefix: a theme's logo also has to resolve from a manifest icon and a stylesheet,
where no client code runs to prepend anything. So each deployment routes `/files/*`
to the API alongside `/api/*` and `/manifest.webmanifest` (the Vite dev servers
already do). The URLs are same-origin for the attendee app, so they survive
offline. Deleting a file the tenant's theme still points at is refused with a 409.
