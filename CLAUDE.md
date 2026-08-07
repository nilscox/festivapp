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
- **Every environment variable is optional**, read via `env()` in `envConfig()` and never
  `process.env` elsewhere; unset switches behaviour rather than crashing (no `DATABASE_URL` runs wasm
  Postgres in-process, no `STORAGE_DIR` keeps uploads in memory, no VAPID keys turn push off), so
  `pnpm dev` and `pnpm test` must work on a machine with nothing installed. Each app has its own
  `.env`.

## API (`apps/api`)

- **Dependencies are parameters, never module singletons or imports of a shared instance.** Anything
  that needs `config`, `logger`, `db`, `storage` or `push` is a factory taking **one destructured
  object** — `createPush({ config, logger, db })`, `requireTenant({ logger, db })`,
  `messagesRoutes({ logger, db, push })` — returning the router, handler or service. Order the
  properties `config, logger, db, storage, push` in both the parameter and the type. A factory that
  currently needs nothing still takes no argument and is still called (`notFound()`,
  `payloadErrorHandler()`, `manifestRoutes()`), so adding a dependency later is not a call-site churn.
- **Entry points are the only place instances are built**: `index.ts` and `cli.ts` each construct the
  graph top-down and pass it in. `seed.ts` takes its deps as its first argument. Nothing below the
  entry point reaches for a global, and nothing builds from config at module level.
- **A router factory's helpers live below it** — `to<Name>Dto`, schemas shared across handlers and
  pure predicates stay module-level functions after the exported factory, not closures inside it.
- **Log through the injected logger, never `console`**, context in the second argument
  (`logger.warn('…', { domain, error })`); `requestLogger` already logs status/duration/tenant. Name
  a caught error `error`, except in Express error middleware where the first parameter is `err` by
  convention. The CLI prints with `console.log` — its output is a result, not a log, and a timestamp
  prefix would break `festival list --json` and `push keys`.
- **The request id rides an `AsyncLocalStorage`** (`middleware/request-context.ts`), which is what
  lets `consoleLogger` tag drizzle's query lines without threading a request-scoped logger through
  every call. It is also stashed on `req.requestId`, which is what `requestLogger` reads — its
  `res.on('finish')` listener is detached from the request's async context.
- **With no `DATABASE_URL` the client is pglite**, created empty, so `index.ts` runs `applyMigrations`
  on that branch and refuses it when `config.env` is `production`. **The CLI requires a real
  `DATABASE_URL`** and asserts on it: its own pglite would be a separate empty database, invisible to
  any server. `@electric-sql/pglite` is a **runtime** dependency; `drizzle-kit` is a dev one, so
  `applyMigrations` imports it dynamically and `db:push`/`db:migrate` are dev-only commands.
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
- **Files go through the injected `storage`** (disk under `STORAGE_DIR`, else memory), never
  `node:fs`; `/files/:id` (`routes/public-files.ts`, unauthenticated) serves them immutable, so bytes
  must not change under an id.
- **Web push is fire-and-forget**: respond `201`, then `void push.sendToTenant(...)`, which logs
  failures and prunes subscriptions on 404/410. VAPID keys are global to the deployment.
- **`db:push` and `db:migrate` are dev commands** — never point either at production, which has no
  `drizzle-kit`. `src/seed.ts` is the canonical dev dataset.
- **`/health` probes the database** and answers `503 { status: 'degraded' }` rather than letting the
  error reach `errorHandler` as a 500.

## Tests (`apps/api/test`)

- **`node --test` + `node:assert/strict` only**, no framework, in `test/<subject>.test.ts`, with rows
  built by `fixtures(suite.db)` rather than raw inserts — `const create = fixtures(suite.db)`, then
  `create.tenant()`, `create.session(tenant, stage, { … })`. `create.theme()` is the one synchronous
  member; don't `await` it.
- Tests hit a real database over real HTTP. **`TestSuite.create()` once per file at the top level**
  owns the two expensive things — the database and the listening socket — and registers the hooks;
  inside a `describe` they would close the server for the other suites.
- **Every test builds its own app: `const api = suite.api(t)`.** Building an app is pure memory
  work, so config and dependencies are per-test, and cookies and log lines die with the test rather
  than being cleared. The suite's `beforeEach` truncates every table, which stays shared.
- **Override dependencies, don't mock modules** — `suite.api(t, { push: stubPush() })` (also
  `config`, `storage`) is what the injected dependencies bought. Reach for `t.mock` only to test a
  service's own internals, as `push.test.ts` does for `webpush` inside `sendToTenant`.
- **Shared per-test setup is an explicit `setup(t)`**, returning `{ api, … }` for the test to
  destructure, never a `beforeEach` writing module-level `let`s.
- **The stub logger prints itself on a failing test** — `suite.api(t)` registers a `t.after` that
  dumps the recorded lines as `diagnostic` output, so a failure comes with the log that explains it.
- **The suite always runs on wasm Postgres**, never a real one, so no environment variable changes
  what it exercises. A migrated pglite database is dumped once per run (`test/helpers/template.ts`,
  wired through `--test-global-setup`, which is what keeps the files from racing to build it) and
  each file boots from a copy with `loadDataDir`. Never call `applyMigrations` from a test —
  replaying the dump costs ~0.3s against ~2.6s of drizzle-kit, which then never loads in a test
  process. The dump is cached under `node_modules/.cache/test-db`, keyed by a hash of
  `db/schema.ts`, so a schema edit invalidates it.
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
- **Forms are TanStack Form** (`components/form/`): `useAppForm` with `revalidateLogic()` and one
  `zod/mini` schema under `validators.onDynamic`, so a form validates on submit and re-validates on
  change. The schema, `toFormValues` and `toInput` are module-level functions **below** the
  component, and **every value lives in the form** — no `useState` beside it, and no coercion in the
  submit handler that the schema could do. Cross-field rules (contrast, roll-over) are a `.check()`
  on the object pushing an issue at the field's `path`. **A rule the organizer may knowingly break is
  a warning, not a validation issue** — a session overlapping another at its location renders from a
  `form.Subscribe` and still submits, matching the schedule list, which flags overlaps rather than
  forbidding them.
- **Controls are the bound field components**, never the raw primitives: `<form.AppField name>` gives
  a typed name, its render prop destructures the one it needs (`{({ InputField }) => …}`), and
  arrays are `mode="array"` plus `ArrayField`, addressing items as `` `styles[${index}]` ``.
- **A control and its field component share a file**, the bound one first and the presentational one
  below (`input.tsx` is `InputField` then `Input`) — a new control means one file plus a line in
  `form.tsx`'s `fieldComponents`. The presentational half stays dumb and controlled; `field.tsx` owns
  the `Field` wrapper that hands Base UI `invalid`/`touched`, so it is what keeps the markup and the
  aria wiring identical across all of them. It only ever forces `touched` **on** — a literal `false`
  pins Base UI's own tracking off — so every bound control wires `onBlur={field.handleBlur}`.
- **Submit through `submitToApi(formApi, …)`** (`lib/errors.ts`), which puts a 400 on the form's
  `onServer` error map via `parseValidationError` and returns whether it saved; anything else is
  already toasted by the `MutationCache`. Its third argument maps a non-400 onto a field (settings'
  409 → `domain`). `<SubmitButton>` reads `isSubmitting`, so no form assembles its own `pending`.
  **`confirm()` returns a promise** resolving once the dialog is done, so a submit that asks first
  (settings' domain move, messages' notification) awaits it and stays `isSubmitting` throughout.
- **Compose the primitives in `components/`**: every inline tag is a `<Chip>`, every list a real
  `<table>` whose column widths are declared once on the `TableHeaderCell` (`table-fixed`).

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
