# CLAUDE.md

Guidance for working in this repository.

## What this is

FestivApp — a white-label, multi-tenant PWA for festival attendees, plus an
organizer backoffice. One deployment serves many festivals; a **tenant** (one
festival) is resolved from the request's `Host` header, and all tenant data is
scoped by `tenants.id`. Attendees never log in — saved events and notes live on
the device; the attendee SPA must work fully offline after first load.

## Layout

```
apps/
  api/         Express 5 + Drizzle + Postgres API
packages/
  contracts/   Shared, type-only request/response types (@festivapp/contracts)
  config/      Shared base tsconfig + oxlint/oxfmt configs (@festivapp/config)
```

Clients (`apps/app`, `apps/admin`, `apps/landing`) are added in later milestones.

## Runtime & TypeScript

- TypeScript runs **directly on Node** (native type stripping) — there is no build
  step and no `tsx`. Because of this:
  - Relative imports use explicit `.ts` extensions (e.g. `import { config } from "./config.ts"`).
  - `erasableSyntaxOnly` is on: no enums, no runtime `namespace`, no parameter
    properties — nothing that emits JS from types.
  - `packages/contracts` is **type-only**; import from it with `import type`.
- The base tsconfig lives in `@festivapp/config/tsconfig.base.json`; each package
  extends it. oxlint and oxfmt work the same way: `packages/config` holds the base
  `oxlint.config.ts`/`oxfmt.config.ts`, and each app/package has its own
  `oxlint.config.ts` and `oxfmt.config.ts` that `extends`/spread the base via
  `defineConfig` (root `oxlint`/`oxfmt` discover them per file).

## Conventions

- **Environment variables have no defaults.** Read them through `requireEnv` (see
  `apps/api/src/env.ts`); a missing required variable must crash the process at
  startup. Each app has its own `.env` (git-ignored), never a shared root one.
- **The seed is committed** (`apps/api/seed.ts`) and is the canonical dev seed; run
  it with `pnpm seed` from `apps/api`.
- **Migrations are committed** (`apps/api/drizzle/`) and are excluded from
  formatting.

## Code style

- **No comments**, except one that states a rule which is hard to guess from
  reading the code. The doc comments in `packages/contracts` are the exception —
  keep them; they are the API documentation.
- **Blank lines before and after blocks** (`if`, `for`, …).
- **kebab-case file names** — `use-clock.ts`, `shell.tsx` (not `useClock.ts` / `Shell.tsx`),
  even for files exporting a PascalCase React component.
- **Straight ASCII quotes and apostrophes** in code and UI copy — not curly/smart
  quotes (no U+2018/U+2019/U+201C/U+201D).
- **Prefer Tailwind scale tokens; avoid arbitrary values** (`[...]`) unless strictly
  required — e.g. a responsive `clamp()`, animation delays, `env()`.
- **Top-down file order** — the main/exported component comes first, then the
  local sub-components and helpers it uses below it. Constants and type
  declarations stay at the top.
- Formatting and linting are enforced by oxfmt and oxlint — run `pnpm format` and
  `pnpm lint`.

## Commands

- Root: `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format`, `pnpm format:check`.
- From `apps/api`: `pnpm dev`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm seed`.
- Local Postgres runs in a container — see the README for the `docker run` command.

## Verifying changes

Before considering a change done: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
`pnpm test`. For API behavior, run `pnpm dev` (from `apps/api`) and exercise the
endpoints with `curl`, setting `Host` (or `?__tenant=`) to pick the tenant.
