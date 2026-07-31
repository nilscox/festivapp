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
  app/         Attendee PWA (Vite + React, offline-first)
  admin/       Organizer backoffice (Vite + React)
packages/
  contracts/   Shared, type-only request/response types (@festivapp/contracts)
  config/      Shared base tsconfig + oxlint/oxfmt configs (@festivapp/config)
  utils/       Shared dependency-free helpers (@festivapp/utils)
```

## Runtime & TypeScript

- TypeScript runs **directly on Node** (native type stripping) — there is no build
  step and no `tsx`. Because of this:
  - Relative imports use explicit `.ts`/`.tsx` extensions (e.g. `import { config } from "./config.ts"`),
    enforced by the `import/extensions` lint rule.
  - `erasableSyntaxOnly` is on: no enums, no runtime `namespace`, no parameter
    properties — nothing that emits JS from types.
  - `packages/contracts` is **type-only**; import from it with `import type`.
- Tooling config is layered: `packages/config` holds the base
  `tsconfig.base.json` / `oxlint.config.ts` / `oxfmt.config.ts`, and each
  app/package extends (or spreads) it in its own config file.
- **Narrow invariants with `assert(value, error?)`** (`@festivapp/utils`), not `!`
  — e.g. `assert(req.tenant)` then `req.tenant.id`. Where you need an expression
  rather than a statement, use `defined(value)`. `!` is a lint error
  (`typescript/no-non-null-assertion`).
- **`packages/utils` holds only pure, dependency-free helpers** that could serve any
  of the three apps (`assert`/`defined`, `has`, color math, `formatBytes`, `matchesSearch`).
  It has no runtime dependencies and touches neither the DOM nor Node built-ins —
  anything app-specific stays in that app's `src/lib/`.
- **Every environment variable is optional**, read through `env(name, default?)`
  (`apps/api/src/config.ts`). `HOST` and `PORT` fall back to a value; the other
  three switch behaviour when unset, rather than standing in for one: no
  `DATABASE_URL` runs an in-process wasm Postgres, no `STORAGE_DIR` keeps uploads
  in memory, no `UPLOAD_MAX_BYTES` leaves body-parser its own 100kb limit. Nothing
  crashes at startup any more, so `pnpm dev` and `pnpm test` work on a machine with
  nothing installed — the flip side being that a deployment which forgets
  `DATABASE_URL` boots on a throwaway database instead of failing loudly. Each app
  has its own `.env` (git-ignored), never a shared root one.
- `UPLOAD_MAX_BYTES` is passed straight to body-parser, so it takes its size
  strings (`5mb`, `1kb`) as well as a plain byte count.

## API conventions

- **With no `DATABASE_URL`, `db/client.ts` swaps the driver for an in-process wasm
  Postgres** (`@electric-sql/pglite`), created empty, schema-pushed at boot with
  `pushSchema` from `drizzle-kit/api-postgres`, and dropped with the process. It is
  what the tests run on, and it boots the API with no database installed. Each
  process gets its own, so nothing written by the CLI is visible to a running
  server — anything that needs data to outlive the process wants real Postgres.
  Both drivers are reached through the same `Database` type and
  `closeDatabase()`; never touch `db.$client` directly, since its two clients have
  different shutdown methods. Keep pglite a devDependency behind the dynamic
  `import()` it sits in — the Postgres path must not load it.
- **Read with the Drizzle relational query API** — prefer
  `db.query.<table>.findMany/findFirst({ where, orderBy })` over hand-written
  `select().from().innerJoin()`; declare cross-table `relations` (`defineRelations`
  in `db/schema.ts`) so `where` can traverse them (e.g. `where: { organizers: { id } }`).
  Writes stay explicit: `db.insert/update/delete(...).returning()`.
- **Always map rows to a contract DTO at the response boundary.** Relational reads
  return **full rows**, so never hand a raw row (or a spread of one) to `res.json`
  — it leaks columns the contract doesn't declare. Write one small `to<Name>Dto(row)`
  per resource; colocate it in the route file when only one caller uses it.
- **DTO vs row naming** — alias the contract type as `<Name>Dto` and keep the
  Drizzle row type as the plain `<Name>` (`import { locations, type Location }` +
  `import type { Location as LocationDto }`).
- **Validate with `schema.parse(req.body)`**, never `safeParse` + a hand-rolled 400. Put normalisation in the schema (zod v4 top-level formats + transforms, e.g.
  `z.email().trim().toLowerCase()`). A thrown `ZodError` becomes
  `400 z.treeifyError(err)` via the shared `zodErrorHandler` (mounted before
  `errorHandler`) — this relies on Express 5 forwarding rejected async handlers.
  Other failures respond `{ error: '<snake_code>' }`.
- **Guard clauses are one-liners:** `return res.status(x).json(...)` (Express 5
  ignores the return value) — no separate `return;`.
- **Compose routers by mounting shared middleware on a parent segment.**
  `/admin/tenants/:tenantId` carries `requireOrganizer, requireTenantMembership`
  once, then nests resource routers (`tenantRouter.use('/locations', locationsRouter)`).
  Group routers by audience under `routes/{app,admin}/` with an assembling
  `index.ts`. Admin routes take the tenant from the URL/session, **never** the
  `Host`; only the public attendee routes run `requireTenant`.
- **Date math via date-fns** — `add(Date.now(), { months: 3 })`, not raw
  millisecond arithmetic.
- **Entity ids are nanoids generated by the API** — `createId()`
  (`apps/api/src/utils.ts`, 8 chars, letters + digits) wired into each table's `id`
  as `.$defaultFn(createId)`; the database has no id default of its own.
- **There are no migrations** — until the project is deployed, the schema is applied
  with `pnpm db:push` and the data recreated from the seed.
- **The seed is committed** (`apps/api/src/seed.ts`) and is the canonical dev
  dataset. It takes a JSON file (`pnpm cli seed <file>`) whose image paths are
  relative to it, and turns each one into a `files` row plus a copy in the storage.

## Tests (`apps/api/test`)

- **`node --test` + `node:assert/strict` only** — no test framework, no new
  dependency. Files are `test/<subject>.test.ts`, `describe`/`it`, run with
  `pnpm test` from `apps/api`.
- **Tests hit a real Postgres over real HTTP.** `useApi()` (`test/helpers/api.ts`)
  starts the Express app on an ephemeral port, truncates every table before each
  test and closes the pool at the end; the returned client carries a cookie jar,
  so `api.login(...)` authenticates every later call. Call it **once per file, at
  the top level** — inside a `describe` its hooks would be suite-scoped and the
  first suite to finish would close the pool for the rest.
- **Tests need nothing running, and read no env file** — every variable being unset
  is the point: each file gets its own private wasm Postgres (hence the parallel
  run), uploads stay in memory, and the upload limit is body-parser's own 100kb,
  which is what the 413 test has to exceed. Keep it that way; a test that needs a
  setting should get it from the request or the fixture, not from the environment.
- Anything exported in the shell still reaches the tests, which is how you run the
  suite against a real Postgres: point `DATABASE_URL` at it, push the schema
  (`DATABASE_URL=… pnpm db:push`), then run node directly so the files stop
  truncating each other's rows —
  `node --test --test-concurrency=1 'test/**/*.test.ts'`.
  `pnpm test --test-concurrency=1` does **not** work: pnpm appends the flag after
  the file pattern, where node ignores it.
- **Build rows with the fixtures** (`test/helpers/fixtures.ts`,
  `createTenant`/`createOrganizer`/`createLocation`/…), which fill in every
  required column and give each row a unique name and domain — don't insert
  through Drizzle in a test file.
- **Only critical paths**, not exhaustive coverage: tenant resolution and tenant
  isolation, authentication and membership, validation rejections, and the
  response body of each read. Assert a full payload with `deepEqual` at least once
  per endpoint — a partial assertion would not catch a row leaking columns the
  contract doesn't declare.
- Cover the tenant scoping of every resource route (another festival's row must
  answer 404, never 200), since that is the invariant the whole product rests on.

## Backoffice conventions (`apps/admin`)

- **The router owns navigation state and gating** (TanStack Router, code-based).
  Do auth/data gating in route `beforeLoad`/`loader`, never in `useEffect`:
  `createRootRouteWithContext<{ queryClient }>`, branch with `throw redirect(...)`,
  and thread shared data (`me`, `tenant`) through route **context**, read via
  `useRouteContext({ from })`. Only the auth gate awaits its data (the root's
  `beforeLoad` + `ensureQueryData(getMeOptions())`); route **loaders fire
  `queryClient.prefetchQuery(...)` without awaiting**, so the page paints at once
  (and a hover still warms the cache through `defaultPreload: 'intent'`). Awaiting
  there would both delay the first paint and turn a failed request into a route
  load error.
- **Transient UI state lives in the URL, not `useState`.** Model drawers/dialogs and
  the selected record as validated search params
  (`validateSearch: z.object({ create: z.optional(z.literal(true)), edit: z.optional(z.string()) })`),
  open with `<LinkButton search={{ … }}>`, close with `navigate({ search: {} })`.
- **Share `queryOptions` / `mutationOptions` factories**, named
  `<verb><Resource>Options(tenantId)` — `getMeOptions()`, `listLocationsOptions(id)`,
  `createParticipantOptions(id)`. Reuse the same factory in route loaders
  (`prefetchQuery`) and in components (`useQuery` / `useMutation`); the call site
  spreads it and adds `onSuccess`, invalidating by the query factory's key.
- **Gate on data with `<QueryBoundary>`**, never a hand-rolled
  `isPending`/`isError`/`isSuccess` triplet. It takes one query result or a tuple
  (`query={[tenantQuery, locationsQuery]}`), renders a spinner until every one has
  data, and hands its `children` render prop one typed argument per query. A query
  whose failure shouldn't take the page down (a theme color, a thumbnail) stays
  outside the boundary and keeps reading `query.data?.…`.
- **A filterable list assembles the `search.tsx` primitives** rather than a single
  list component: `SearchInput`, `SearchSummary` (the count line — its `children`
  are the idle summary, the "n of m matching" form is built in) and `NoMatch` (the
  no-match `EmptyState` with its clear button). The list keeps the filtering itself
  (`items.filter((item) => matchesSearch(search, …))`, no `useMemo` — the lists are
  small and the closure would break the deps) and renders its own rows. It holds the
  search state too: a page in the URL through `useSearchParam(from)` (widen its route
  union when a new route gains a `search` param), a drawer in a `useState`. The
  "nothing at all yet" empty state is a separate early return — it belongs to the
  resource, not to the search.
- **Errors are thrown, and caught by two boundaries, both rendering `RouteError`**
  (message, retry through `router.invalidate()`, stack in dev). `Page` wraps its
  content — not its header — in a `CatchBoundary` keyed on the router's `loadedAt`,
  so a page that throws keeps its title and the shell around it; the router's
  `defaultErrorComponent` is the outer net for whatever throws outside a page's
  content (the header, `beforeLoad`, a lazy chunk). Keep headers readable without
  data (`Boolean(query.data?.length)`), since they still render in the error state.
- **One `ApiError`, guarded by `ApiError.is(err, status?)`.** `lib/api.ts` throws it
  (carrying `status`, raw `body`, parsed `error` code). Cross-cutting handling is
  central in `main.tsx`: `retry` skips 4xx; a 401 on any query or mutation — while a
  session is cached, so a failed login isn't one — clears the cache and re-runs the
  router, letting the root's `beforeLoad` redirect to `/login`; and the
  `MutationCache` runs `toast.error` (`react-hot-toast`) on every failure except a
  400 and except a mutation that declares its own `onError`. **That opt-out only sees
  `useMutation` options** — a per-call `mutate(vars, { onError })` is invisible to the
  cache and still toasts, which is how a call site reverts an optimistic update
  without silencing the message.
- **Server errors go to `<Form errors>`, not to a field.** `parseValidationError`
  (`lib/errors.ts`) flattens the API's zod tree into the `{ [field name]: messages }`
  shape Base UI expects — a path becomes a dotted name, so an error on one item of an
  array lands on that item's input (`styles.0`) rather than on the array. A `useMemo`
  on the mutation error keeps the object's reference stable (Base UI re-seeds its
  internal copy whenever the prop changes, and clears a
  message as soon as its field is edited). Anything else that isn't a zod tree is
  mapped to the same shape at the call site (settings turns a 409 into a `domain`
  message). `<Field error=…>` is left for messages computed on the client.
- **Forms use Base UI `<Form onFormSubmit>`** — it yields typed values; don't read
  `FormData` or control inputs by hand. Keep inputs uncontrolled (`defaultValue`) and
  wrap every control (`Input`, `Select`) in `<Field name=…>` so it registers with the
  form and surfaces validity: `errors` declares a custom message per native match,
  and the match-less `<Field.Error>` underneath renders the server message (and the
  browser's for undeclared matches), skipped while a declared match shows its own.
  `FieldArray` is a named field too, so an error on the array itself has a place to
  render.
- **Compose small primitives**, exported component first with sub-components below:
  `Field`, `Input`, `Select`, `Table`/`TableHeader`, `Page`/`PageHeader`,
  `EmptyState`, `Spinner`, `Drawer`, `ConfirmDialog`,
  `Button`/`LinkButton`/`IconButton`. Use `createLink` to make a styled anchor
  router-aware.
- **Keep the first-paint bundle small.** Lazy-load heavy route components with
  `lazyRouteComponent(() => import('./x.tsx'), 'X')` (route definitions, loaders and
  `validateSearch` stay eager so they can still prefetch) — this defers Base UI's
  dialogs/select + floating-ui off the login path. Use **`zod/mini`**
  (`import * as z from 'zod/mini'`; `z.optional(z.string())` rather than
  `z.string().optional()`), not full `zod` — same Standard-Schema behavior at a
  fraction of the size.

## Attendee app conventions (`apps/app`)

Deliberately simpler than the backoffice — no auth, no forms, no router context.

- **All data comes from one `/bootstrap` query** (`lib/bootstrap.ts`), shaped once
  in `select` (sorting, id → entity maps) and read through `useTenant()` /
  `useSession(id)` style hooks. Add derived reads there rather than re-deriving in
  components.
- **Offline-first:** the query client is wrapped in `PersistQueryClientProvider`
  backed by `idb-keyval`, and `vite-plugin-pwa` precaches the shell. Anything that
  breaks a cold, offline start is a bug.
- **Theming is per-tenant at runtime** — `applyTenant` sets CSS variables from the
  bootstrap payload; don't hardcode brand colors. The organizer picks two colors
  (`backgroundColor`, `accentColor`, hex only); everything else is derived there
  with `color-mix`, over an ink picked from the background's luminance. There is
  no dark mode — a dark tenant is just a dark `backgroundColor`. A tenant's
  `customCss` goes into a `<style>` via `textContent` (never `innerHTML`, which
  would let the CSS close the tag and inject markup).

## Styling

- **Prefer Tailwind scale tokens; avoid arbitrary values** (`[...]`) unless strictly
  required — e.g. a responsive `clamp()`, animation delays, `env()`.
- Use the `.row`/`.col` flex utilities, and the custom text scale tokens
  (`text-xxs`, plus `text-label`/`text-form` in admin) defined in each app's
  `@theme` block.
- In admin, a global `* { border-color: … }` means `border` needs no color; animate
  Base UI popups with the shared `.base-ui-fade` helper +
  `data-starting-style`/`data-ending-style`.
- Wrap static class lists in `clsx(...)` so oxfmt sorts them.

## Code style

- **No comments**, except one that states a rule which is hard to guess from
  reading the code. This holds in `packages/contracts` too — document only the
  non-obvious there (units, invariants, what a field means to the client, what
  makes a value nullable), never the self-evident.
- **Blank lines before and after blocks** (`if`, `for`, …).
- **kebab-case file names** — `use-clock.ts`, `shell.tsx` (not `useClock.ts` / `Shell.tsx`),
  even for files exporting a PascalCase React component.
- **Straight ASCII quotes and apostrophes** in code and UI copy — not curly/smart
  quotes (no U+2018/U+2019/U+201C/U+201D).
- **Top-down file order** — the main/exported component comes first, then the
  local sub-components and helpers it uses below it. Constants and type
  declarations stay at the top.

## Commands

- Root: `pnpm typecheck`, `pnpm lint`, `pnpm format`
- `apps/api`: `pnpm dev`, `pnpm db:push`, `pnpm test`, `pnpm cli`
  (e.g. `pnpm cli organizer create <email> <password> <domain…>` to get a
  backoffice login, `pnpm cli seed <file>` to load a festival).
- `apps/app` / `apps/admin`: `pnpm dev`, `pnpm build`, `pnpm preview`.
- Local Postgres runs in a container — see the README for the `docker run` command.

To verify API behavior, run `pnpm dev` from `apps/api` and exercise the endpoints
with `curl`, setting `Host` (or `?__tenant=`) to pick the tenant.
