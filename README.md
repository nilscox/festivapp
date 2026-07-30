# FestivApp

White-label, multi-tenant PWA for festival attendees, with an organizer backoffice.
One deployment serves many festivals: a tenant (one festival) is resolved from the
request's `Host` header, and all of its data is scoped to it.

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

pnpm workspaces, TypeScript run directly by Node (no build step), oxlint + oxfmt.

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

## Getting started

Node ≥ 24 and pnpm. A PostgreSQL database is optional — see [Configuration](#configuration).

```bash
pnpm install
cp apps/api/.env.example apps/api/.env

cd apps/api   && pnpm db:push && pnpm dev   # API on http://127.0.0.1:3000
cd apps/app   && pnpm dev                   # attendee PWA on http://localhost:8000
cd apps/admin && pnpm dev                   # backoffice on http://localhost:8001
```

`pnpm cli seed <file>` loads a festival from a seed JSON file, `pnpm cli --help`
lists the rest.

## Configuration

Each app has its own `.env`, and every variable is optional. For the API:

| Variable           | Unset means | Description                             |
| ------------------ | ----------- | --------------------------------------- |
| `HOST`             | localhost   | Address the API listens on              |
| `PORT`             | 3000        | Port the API listens on                 |
| `DATABASE_URL`     | in-memory   | Postgres connection string              |
| `STORAGE_DIR`      | in-memory   | Directory uploaded files are written to |
| `UPLOAD_MAX_BYTES` | 100kb       | Largest accepted upload (`5mb`, `2048`) |

The last three switch to an in-memory implementation rather than to a default
value: with no `DATABASE_URL` the API runs on a Postgres compiled to wasm
([PGlite](https://pglite.dev)), created empty and thrown away on exit.

## Tests

```bash
cd apps/api && pnpm test
```

Node's test runner, driving the Express app over HTTP. Nothing needs to be running:
each test file gets its own wasm Postgres and keeps uploads in memory, so the files
run in parallel. Exporting `DATABASE_URL` runs the same suite against a real
Postgres — add `--test-concurrency=1` there, or the files truncate each other's rows.

## Tenant resolution

Every public attendee route is tenant-scoped (`/admin` takes its tenant from the
URL instead, and `/files` from the file id). The tenant is matched against
`tenants.domain` using, in order: a `?__tenant=` query param, an `X-Tenant-Domain`
header (both for local/testing convenience), then the real `Host`. Unknown hosts
get a 404.
