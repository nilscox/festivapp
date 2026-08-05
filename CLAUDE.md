# CLAUDE.md

FestivApp — a white-label, multi-tenant PWA for festival attendees plus an organizer backoffice. One
deployment serves many festivals: a **tenant** is resolved from the request's `Host` and all tenant
data is scoped by `tenants.id`. Attendees never log in — saved events and notes live on the device,
and the SPA must work fully offline after first load.

```
apps/api      Express 5 + Drizzle + Postgres          apps/app    Attendee PWA (Vite + React)
apps/admin    Organizer backoffice (Vite + React)
packages/     contracts (type-only) · config (tsconfig/oxlint/oxfmt) · utils (pure helpers)
```

## Runtime & TypeScript

- TypeScript runs **directly on Node** (type stripping): no build step, relative imports carry
  `.ts`/`.tsx` extensions, `erasableSyntaxOnly` is on (no enums, `namespace`, parameter properties),
  and `packages/contracts` is `import type` only.
- **Narrow with `assert(value)` / `defined(value)`** (`@festivapp/utils`) — `!` is a lint error.
- **`packages/utils` stays pure and dependency-free** — app-specific helpers go in that app's `lib/`.
- **Every environment variable is optional**, read via `env()` in `envConfig()`; unset switches
  behaviour rather than crashing (no `DATABASE_URL` runs wasm Postgres in-process, no `STORAGE_DIR`
  keeps uploads in memory, no VAPID keys turn push off), so `pnpm dev` and `pnpm test` must work on
  a machine with nothing installed. Each app has its own `.env`.

## API (`apps/api`)

- **Dependencies come from the awilix container** (`src/container.ts`), never a module singleton.
  Injection is `PROXY`, so **every factory takes the cradle and destructures** — a positional
  parameter silently receives the cradle. A singleton may not depend on a scoped registration.
- **A request gets a child scope on `req`** — `req.container.resolve('db')`; `db` is scoped so queries
  log under the request id, and `container.dispose()` closes the singleton pool. `cli.ts`, `seed.ts`
  and the tests resolve the imported container. Never build from config at module level.
- **Log through the container's logger, never `console`**, context in the second argument
  (`logger.warn('…', { domain, err })`); `requestLogger` already logs status/duration/tenant. The
  CLI keeps `console.log`, its output being a result rather than a log.
- **With no `DATABASE_URL` the client is pglite**, created empty, so `container.ts` runs
  `applyMigrations` on that branch only; each process gets its own, so CLI writes are invisible to a
  live server. `@electric-sql/pglite` and `drizzle-kit` are **runtime** dependencies — moving either
  to `devDependencies` kills the production image with tests and typecheck still green.
- **Read with the relational query API** (`db.query.<table>.findMany({ where, orderBy })`,
  traversing declared `relations`); writes stay explicit with `.returning()`.
- **Map rows to a contract DTO at the response boundary** — reads return full rows, so never hand one
  to `res.json`; write a `to<Name>Dto(row)`, aliasing the contract type `<Name>Dto`.
- **Validate with `schema.parse(req.body)`**, normalising in the schema (`optionalString()`), never
  `safeParse` plus a hand-rolled 400: a `ZodError` becomes `400 z.treeifyError(err)`, other failures
  `{ error: '<snake_code>' }`. Guard clauses are one-liners: `return res.status(x).json()`.
- **`PATCH` a flat resource, `PUT` one with children** (a session owns its participants rows).
- **Mount shared middleware on a parent segment**, nesting resource routers under it, grouped by
  audience in `routes/{app,admin}/`. Admin routes take the tenant from the URL/session, **never** the
  `Host`; only attendee routes run `requireTenant` (`?__tenant=`, `x-tenant-domain`, hostname).
- **Files go through the `storage` registration** (disk under `STORAGE_DIR`, else memory), never
  `node:fs`; `/files/:id` serves them immutable, so bytes must not change under an id.
- **Web push is fire-and-forget**: respond `201`, then `void push.sendToTenant(...)`, which logs
  failures and prunes subscriptions on 404/410. VAPID keys are global to the deployment.
- **Dev uses `pnpm db:push`, production committed migrations** (`pnpm db:migrate`) — never point
  `db:push` at production. `src/seed.ts` is the canonical dev dataset.

## Tests (`apps/api/test`)

- **`node --test` + `node:assert/strict` only**, no framework, in `test/<subject>.test.ts`, with rows
  built by `test/helpers/fixtures.ts` rather than raw inserts.
- Tests hit a real database over real HTTP. Call **`useApi()` once per file at the top level** —
  inside a `describe` its hooks close the pool for the other suites.
- **Override the container, never the environment**: `useApi({ … })` takes a partial `Config` and
  `registerTestDependencies` re-applies config + logger as **values** after every `beforeEach`
  (re-registering a factory does not evict a cached singleton). Each file gets its own wasm Postgres.
- **Critical paths only** — tenant resolution and isolation, auth and membership, validation
  rejections, and each read's body. `deepEqual` a full payload at least once per endpoint, and give
  every resource route its tenant-scoping test (another festival's row answers 404).

## Backoffice (`apps/admin`)

- **The router owns navigation and gating** (TanStack Router, code-based): gate in
  `beforeLoad`/`loader`, never `useEffect`, threading `me`/`tenant` through route context; only the
  auth gate awaits, loaders `prefetchQuery` without awaiting.
- **Transient UI state lives in the URL** — drawers and the selected record as validated search
  params, opened with `<LinkButton search={{ … }}>`.
- **Reads share a `queryOptions` factory in `lib/queries.ts`, writes don't** — mutations are inline
  in the component, invalidating by the factory's key.
- **Gate on data with `<QueryBoundary>`** (one query or a tuple), never a hand-rolled
  pending/error/success triplet; a query that shouldn't take the page down stays outside it.
- **A filterable list assembles the `search.tsx` primitives** and holds its own search state, never
  behind a `useMemo`; the "nothing yet" empty state is a separate early return.
- **Errors are thrown, and two boundaries render `RouteError`** — `Page` wraps its content but not
  its header, so headers must read without data.
- **One `ApiError`, guarded by `ApiError.is(err, status?)`**, handled centrally in `main.tsx`: no
  retry on 4xx, a 401 clears the cache and re-runs the router, and the `MutationCache` toasts every
  failure except a 400 or a `useMutation` declaring its own `onError`.
- **Forms are Base UI `<Form onFormSubmit>`**, inputs uncontrolled, every control in `<Field name>`;
  server errors go to `<Form errors>` through `parseValidationError` behind a `useMemo`, leaving
  `<Field error>` for client-computed messages.
- **Compose the primitives in `components/`**: every inline tag is a `<Chip>`, every list a real
  `<table>` whose column widths are declared once on the `TableHeaderCell` (`table-fixed`).
- **Keep the first paint small**: `lazyRouteComponent` for heavy components, and **`zod/mini`**.

## Attendee app (`apps/app`)

- **All data comes from one `/bootstrap` query**, shaped once in `select` and read through
  `useTenant()`/`useSession(id)`; add derived reads there, not in components.
- **Offline-first**: `PersistQueryClientProvider` over `idb-keyval` plus `vite-plugin-pwa`, and
  anything that breaks a cold offline start is a bug.
- **The service worker is hand-written** (`src/sw.ts`) because a generated one cannot carry a `push`
  handler; it owns the precache and the `/files/` `CacheFirst` route, so re-verify a cold offline
  boot after touching it.
- **Push opt-in is asked for, never assumed** (one `usePushSubscription()` store behind the banner and
  the toggle): subscribe from a click (Safari), feature-detect `PushManager`, and treat a null
  `pushPublicKey` as push being off.
- **Timetable filters are route-local `useReducer`**, called once by the route and passed down, with
  every transition in the reducer.
- **A session carries its own `day` key** (`yyyy-MM-dd`, tenant timezone) from the bootstrap
  `select`, which also derives `days` and `styles`. **Never re-format a day key** — parsed as UTC it
  lands a day early west of Greenwich; label from a session's `startsAt`.
- **Overlays go through `<Sheet>`**, opened with **`showModal()` from an effect, never the `open`
  attribute** (which silently costs the focus trap, scroll lock and Escape). It needs
  `fixed inset-0 z-50`, a scrim element rather than `backdrop:*`, and an explicit `text-ink`.
- **Theming is per-tenant at runtime** — `applyTenant` turns the bootstrap theme into CSS variables,
  shading the palette from the background with `color-mix` over an ink from its luminance; never
  hardcode brand colors, and there is no dark mode. It mirrors them into `localStorage`, replayed by
  an inline script in `index.html` so an offline start paints themed. `customCss` is set with
  `textContent`, never `innerHTML`.
- **Analytics is a build-time Matomo**, off unless both `VITE_ANALYTICS_*` are set, so changing it
  means rebuilding the image. `initAnalytics()` runs from `main.tsx`, not an effect (StrictMode).

## Styling & code style

- **Prefer Tailwind scale tokens over arbitrary values** unless required (`clamp()`, delays, `env()`);
  use the `.row`/`.col` utilities and each app's text tokens, and wrap static class lists in
  `clsx(...)` so oxfmt sorts them. In admin, `border` needs no color (a global `* { border-color }`).
- **No comments**, except one stating a rule that is hard to guess from the code — including in
  `packages/contracts`, where only units, invariants and nullability earn a word.
- **Blank lines around blocks**; **kebab-case file names** even for a PascalCase component;
  **straight ASCII quotes** in code and copy; **top-down file order** (exported thing first, helpers
  below, constants and types at the top).

## Deployment

Each app ships as its own image, built by `.github/workflows/deploy.yml` and redeployed by a Coolify
webhook. Production needs `DATABASE_URL` (unset, the API boots on pglite and loses everything on
restart) and a volume for `STORAGE_DIR`.

- **The API image keeps the pnpm workspace layout, symlinks included** — `packages/utils` ships
  TypeScript sources and node refuses to strip types under a real `node_modules` directory.
- **The frontends are same-origin**: nginx proxies `/api/*` and `/files/*` to `${API_URL}` and **must
  forward `Host`**; keep the upstream in a variable with a `resolver` so nginx starts before the API.
- **Build stages must not copy the root `tsconfig.json`** — it references every project.

## Commands

- Root: `pnpm typecheck`, `pnpm lint`, `pnpm format` — CI runs those plus the API tests and both
  frontend builds.
- `apps/api`: `pnpm dev`, `pnpm db:push`, `pnpm db:migrate`, `pnpm test`, `pnpm cli` (`organizer
  create <email> <password> <domain…>`, `seed <file>`); `apps/app` / `apps/admin`: `pnpm dev`,
  `pnpm build`, `pnpm preview`.

**Typecheck and lint passing do not prove the app runs** — a wrong import extension passes both and
still breaks the bundle, so run the app's `pnpm build` and load the page before calling a UI change
done. For the API, `pnpm dev` and curl the endpoints with a `Host` (or `?__tenant=`).
