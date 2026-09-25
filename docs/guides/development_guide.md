# Gabayan PWA development guide

How to work on the PWA: the quality gate, the test suites, running them against the FastAPI
backend, and how the source is organised. Read [AGENTS.md](../../AGENTS.md) for the product rules
and conventions, and the [implementation plan](../implementation_plan.md) and
[API contract](../api_contract.md) before adding features. To get a working environment, follow the
[setup guide](setup_guide.md).

## Contents

- [Scripts](#scripts)
- [Quality checks](#quality-checks)
- [Contract suite](#contract-suite)
- [Browser journeys](#browser-journeys)
- [Running against another API](#running-against-another-api)
- [Source layout](#source-layout)
- [Adding a feature](#adding-a-feature)

## Scripts

| Script               | What it does                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `pnpm dev`           | Vite dev server on http://localhost:5173 (add `--host 127.0.0.1` when the API is on 127.0.0.1) |
| `pnpm dev:mock`      | The mock API on http://localhost:3001/api/v1                                                   |
| `pnpm dev:all`       | Both, side by side                                                                             |
| `pnpm mock:reset`    | Restores `mock-api/db.json` from `mock-api/fixtures/seed.json`                                 |
| `pnpm build`         | Strict type check, then the production PWA build in `dist/`                                    |
| `pnpm preview`       | Serves `dist/` on http://localhost:4173                                                        |
| `pnpm lint`          | ESLint across the app, the mock and the tests                                                  |
| `pnpm typecheck`     | `vue-tsc` in strict mode                                                                       |
| `pnpm test`          | Unit and component tests (Vitest, jsdom)                                                       |
| `pnpm test:contract` | Resets the mock, then runs the contract suite                                                  |
| `pnpm test:e2e`      | Resets the mock, then runs the Playwright journeys                                             |
| `pnpm test:watch`    | Vitest in watch mode                                                                           |
| `pnpm format`        | Prettier check (Markdown included); `pnpm format:write` fixes formatting                       |
| `pnpm check`         | `lint`, `typecheck`, `test`, `test:contract` and `build`, in that order                        |

## Quality checks

```powershell
pnpm check
pnpm test:e2e
pnpm format
```

`pnpm check` runs linting, strict type checking, unit tests, mock contract tests, and the
production PWA build. The end-to-end command starts the app and mock API automatically. The
[release checklist](../release_checklist.md) records the counts from the last full run.

## Contract suite

`npx vitest run tests/contract` drives the API through the same requests whatever server answers
them. By default it runs an in-process mock on a fresh copy of `mock-api/fixtures/seed.json`, so it
needs no reset. It signs in as the seeded demo farmer, creates its own accounts with unique emails,
finds seeded records by name, SKU or order number rather than by id, and ends with a coverage check
that fails when any method-and-path row of [the endpoint catalog](../api_contract.md) (§5) went
uncalled.

The development fixtures `demo-google-token` and `demo-reset-token` are asserted as accepted by the
mock and refused by any other server. `tests/contract/pwa-client.contract.spec.mjs` then signs in
through the app's own data layer - the `src/pages/*/data/*.api.ts` functions, their query strings and
Zod schemas - and reads every resource the demo farmer has, so a schema stricter than the server
fails there rather than on a screen.

## Browser journeys

The Playwright journeys in `tests/e2e/` run in Chrome with a Pixel 7 profile at the `390 x 844 px`
target viewport, one worker at a time. With `VITE_API_BASE_URL` unset, Playwright starts its own
freshly seeded mock on port 3101 and the app on port 5174 (`E2E_MOCK_API_PORT`, `E2E_APP_PORT`),
apart from `pnpm dev:all`, and never reuses a server already listening: a busy port fails the run
rather than letting the journeys meet another run's data.

The journeys' mock starts on `2026-09-23T07:30:00+08:00` (`MOCK_API_NOW`), the seed day before its
first feeding time. The cultivation journeys also pin the browser clock to that day, because Home
and the cultivation screens count from the browser's own date. A journey that needs a later time
sends the mock's test-only `X-Mock-Now` header (contract §15). To pin the clock of a mock you run
yourself:

```powershell
$env:MOCK_API_NOW = '2026-09-23T07:30:00+08:00'   # macOS/Linux: MOCK_API_NOW=... pnpm dev:mock
pnpm dev:mock
```

## Running against another API

Point the suites at a server that implements the contract and holds the demo seed for the journeys'
day, 2026-09-23. For the FastAPI service in `aqua-lens-api`, start from an empty database each time,
because the suites change the demo farmer's tasks, records, cart and orders:

```powershell
# in aqua-lens-api
docker compose down -v
docker compose up -d
python -m alembic upgrade head
python -m app.cli seed-demo --date 2026-09-23
$env:WEATHER_PROVIDER = 'fixture'
uvicorn app.main:app --port 8000
```

Then, from this repository:

```powershell
$env:CONTRACT_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'
npx vitest run tests/contract

# reseed as above, then run the journeys against the same server
$env:VITE_API_BASE_URL = 'http://127.0.0.1:8000/api/v1'
npx playwright test --reporter=line
```

`CONTRACT_API_BASE_URL` and `VITE_API_BASE_URL` are the full API root, `/api/v1` included.
Any server named by `VITE_API_BASE_URL` other than the journeys' own mock is left to you, and the
app opens on port 5173, the origin FastAPI's `CORS_ORIGINS` names - on `127.0.0.1` when the API is
on `127.0.0.1`, and on `localhost` otherwise (`tests/e2e/support/api-target.ts`). Clear both
variables (`Remove-Item Env:CONTRACT_API_BASE_URL, Env:VITE_API_BASE_URL`) to return to the mock.

### Known differences against FastAPI

A run on 2026-09-25 against `aqua-lens-api` at `f2df253` (fresh database,
`seed-demo --date 2026-09-23`, `WEATHER_PROVIDER=fixture`) gave:

- **Contract suite: 105 of 106.** The failing check, _keeps dashboard, tasks, and notifications
  coherent after feeding completion_, expects three unread notifications and found six.
- **Journeys: 23 of 28.** `buy-now.spec.ts` (both), `feeds.spec.ts`, `pro-logs.spec.ts` (the Pro
  farmer journey) and `weather-alerts.spec.ts` (the heat-alert journey) failed.

Every screen involved worked; the failures come from two assumptions in the tests:

- **The server's clock.** FastAPI raises reminders, dates new records and counts forecast days
  from its real clock, which cannot be pinned the way `MOCK_API_NOW` pins the mock (BLOCKERS
  D-67). On any day other than 2026-09-23 the unread count, a saved reading's date and the
  forecast days differ from what the checks expect.
- **Mock identifiers.** The two Buy-now journeys and the feeds journey assert URLs containing the
  mock's ids (`prd_pond_aerator`, `sp_tilapia`); FastAPI's ids are UUIDs.

## Source layout

Each thing a farmer does is a feature folder under `src/pages/<feature>/`: `auth`, `setup`, `home`,
`cultivations`, `feeds`, `water-quality`, `weather-alerts`, `tiers`, `marketplace`, `cart`,
`orders`, `notifications`, `profile` and `public`.

- `data/` - `<feature>.api.ts` (one function per endpoint, paths from `ENDPOINTS` in
  `src/core/url_paths.ts`, responses parsed by Zod), `<feature>.repository.ts` and the TanStack
  Query keys in `<feature>.keys.ts`.
- `domain/` - `<feature>.model.ts` with schemas, types and pure helpers, and the repository
  interface.
- `presentation/` - routed `views/`, the feature's `components/`, and `composables/` that own
  queries, mutations and screen state.

App-wide code lives in `src/core/` (HTTP client, endpoints, query client and invalidation map,
error wording, formatters), `src/components/`, `src/layouts/`, `src/router/` and `src/stores/`.
Views and components never import `@core/http`, `@tanstack/vue-query` or a `data/` module;
`npx eslint .` reports any `.vue` file that does. Routes are declared in
`src/router/routes/*.routes.ts` and navigation goes by the names in `src/router/route-names.ts`.

```text
src/
|-- main.ts, App.vue          bootstrap and providers
|-- core/                     http/, url_paths.ts, query/, errors/, composables/, utils/, navigation.ts
|-- components/               shared UI: ui/, feedback/, overlays/, navigation/, brand/
|-- layouts/                  public, setup and authenticated mobile layouts
|-- router/                   routes/<area>.routes.ts, route-names.ts, guards/, index.ts
|-- stores/                   session.store.ts, toast.store.ts
|-- styles/                   tokens and global styles
`-- pages/<feature>/          data/, domain/, presentation/
mock-api/
|-- server.mjs                JSON Server composition and every custom route
|-- fixtures/seed.json        the deterministic seed
|-- reset.mjs                 restores db.json from the seed
`-- reminders.mjs, water-logs.mjs, weather-alerts.mjs, dates.mjs
tests/
|-- unit/<feature>/, component/<feature>/
|-- contract/                 the contract suite and its scenarios
`-- e2e/                      Playwright journeys
```

## Adding a feature

New behaviour goes through the contract first, in this order:

1. **Contract** - add or change the rows and schemas in [api_contract.md](../api_contract.md).
2. **Mock** - implement it in `mock-api/server.mjs`, seed any data in `mock-api/fixtures/seed.json`,
   and cover it in `tests/contract/scenarios/`.
3. **PWA** - add the endpoint to `ENDPOINTS`, the feature's `data/`, `domain/` and `presentation/`
   code, component tests, and a journey when it changes a critical path.
4. **API** - implement the same rows in `aqua-lens-api`, with its demo figures seeded by migration.

The [Definition of Done in AGENTS.md](../../AGENTS.md#definition-of-done) applies to every change,
including updating these documents when routes, resources, states or commands change.
