# FestivApp

White-label, multi-tenant PWA for festival attendees, with an organizer backoffice.
A tenant (one festival) is resolved from the request's `Host` header.

## Stack

- **API** — Express 5 + Drizzle ORM + Postgres, TypeScript run directly by Node
  (native type stripping, no build step).
- **Clients** — Vite + React SPAs: `app` (attendee PWA, offline-first) and
  `admin` (organizer backoffice).
- **Monorepo** — pnpm workspaces. Shared, type-only API contracts in
  `packages/contracts`, dependency-free helpers in `packages/utils`, and shared
  tool configs in `packages/config`.
- **Tooling** — oxlint, oxfmt.

## Layout

```
apps/
  api/         Express 5 + Drizzle + Postgres API
  app/         Attendee PWA (Vite + React, offline-first)
  admin/       Organizer backoffice (Vite + React)
packages/
  contracts/   Shared, type-only request/response types
  utils/       Shared dependency-free helpers
  config/      Shared base tsconfig, oxlint and oxfmt configs
```

## Prerequisites

Node ≥ 24, pnpm, a PostgreSQL database.

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
```

Then, from `apps/api`:

```bash
pnpm db:push                 # apply the Drizzle schema to the database
pnpm cli seed <file>         # load a festival from a seed JSON file
pnpm dev                     # start the API on http://127.0.0.1:3000
```

Then run either client:

```bash
cd apps/app   && pnpm dev    # attendee PWA on http://localhost:8000
cd apps/admin && pnpm dev    # admin backoffice on http://localhost:8001
```

## Scripts

Run from the repo root (whole workspace):

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `pnpm typecheck` | Typecheck every workspace package |
| `pnpm lint`      | Run oxlint                        |
| `pnpm format`    | Run oxfmt                         |

Run from `apps/api`:

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `pnpm dev`        | Run the API with `node --watch` |
| `pnpm start`      | Run the API once                |
| `pnpm db:push`    | Push the schema to the database |
| `pnpm db:migrate` | Apply pending migrations        |
| `pnpm cli`        | Run the CLI (`pnpm cli --help`) |

Run from `apps/app` or `apps/admin`:

| Command        | Description                |
| -------------- | -------------------------- |
| `pnpm dev`     | Start the Vite dev server  |
| `pnpm build`   | Build the SPA into `dist/` |
| `pnpm preview` | Serve the built SPA        |

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
