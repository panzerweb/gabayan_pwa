# Gabayan PWA

Gabayan is a mobile-first guide for beginner and small-scale fish farmers in the Philippines. The frontend is a Vue 3 progressive web app. It runs against a contract-faithful JSON Server mock or the separate FastAPI service in `aqua-lens-api`; switching between them is one environment variable.

## Prerequisites

- Node.js 24+
- pnpm 11+
- Google Chrome for the current Playwright mobile test project

## Start locally

```powershell
Copy-Item .env.example .env
pnpm install
pnpm mock:reset
pnpm dev:all
```

- App: `http://localhost:5173`
- Mock API: `http://localhost:3001/api/v1`
- Health check: `http://localhost:3001/api/v1/health`

`VITE_API_BASE_URL` is the only frontend server-location setting. Keep it pointed at a server that implements [the v1 contract](docs/api_contract.md).

## Mock or FastAPI

The two servers differ in that one value and nothing else; no code in `src/` asks which one
answers:

| API     | `VITE_API_BASE_URL`            | Open the app on         |
| ------- | ------------------------------ | ----------------------- |
| Mock    | `http://localhost:3001/api/v1` | `http://localhost:5173` |
| FastAPI | `http://127.0.0.1:8000/api/v1` | `http://127.0.0.1:5173` |

For FastAPI, start `aqua-lens-api` as its README ("Running the PWA against this API") describes,
set the variable in `.env`, and run `pnpm dev --host 127.0.0.1`. The app is opened on the API's host
because the refresh cookie is `SameSite=Lax`, and `localhost` and `127.0.0.1` are different sites: on
the other host, signing in works but the session is lost on reload. On FastAPI the demo account
exists only after its `seed-demo` command, with the same email and password; the Google demo button
is a mock fixture that FastAPI answers as unavailable.

## Quality checks

```powershell
pnpm check
pnpm test:e2e
```

`pnpm check` runs linting, strict type checking, unit tests, mock contract tests, and the production PWA build. The end-to-end command starts the app and mock API automatically.

## Contract suite

`npx vitest run tests/contract` drives the API through the same requests whatever server answers
them. By default it runs an in-process mock on a fresh copy of `mock-api/fixtures/seed.json`, so it
needs no reset. It signs in as the seeded demo farmer, creates its own accounts with unique emails,
finds seeded records by name, SKU or order number rather than by id, and ends with a coverage check
that fails when any method-and-path row of [the endpoint catalog](docs/api_contract.md) (§5) went
uncalled:

```text
Endpoint catalog coverage: 68 of 68 rows exercised against in-process mock.
```

The development fixtures `demo-google-token` and `demo-reset-token` are asserted as accepted by the
mock and refused by any other server. `tests/contract/pwa-client.contract.spec.mjs` then signs in
through the app's own data layer - the `src/pages/*/data/*.api.ts` functions, their query strings and
Zod schemas - and reads every resource the demo farmer has, so a schema stricter than the server
fails there rather than on a screen.

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
With `VITE_API_BASE_URL` unset, Playwright starts its own freshly seeded mock on port 3101 and the
app on port 5174 (`E2E_MOCK_API_PORT`, `E2E_APP_PORT`), apart from `pnpm dev:all`, and never reuses
a server already listening: a busy port fails the run rather than letting the journeys meet another
run's data. Any other server named by `VITE_API_BASE_URL` is left to you, and the app opens on port
5173, the origin FastAPI's `CORS_ORIGINS` names - on `127.0.0.1` when the API is on `127.0.0.1`, and
on `localhost` otherwise (`tests/e2e/support/api-target.ts`). Clear both
variables (`Remove-Item Env:CONTRACT_API_BASE_URL, Env:VITE_API_BASE_URL`) to return to the mock.

## Source layout

Each thing a farmer does is a feature folder under `src/pages/<feature>/` (`auth`, `setup`,
`home`, `cultivations`, `marketplace`, `cart`, `orders`, `notifications`, `profile`, `public`):

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

## Development sign-in

After `pnpm mock:reset`, the deterministic existing-user account is:

- Email: `juan@example.com`
- Password: `Gabayan123!`

The registration flow creates additional mock users. These credentials and the Google sign-in
button are development fixtures only.

## Current foundation

- Responsive public authentication, four-step cultivation setup, and authenticated application
  experiences at the `390 x 844 px` target viewport.
- Tokenized aquatic design system with reusable buttons, inputs, cards, status chips, icons,
  loading/empty/error states, modal/sheet, toast, headers, progress, and exactly four primary
  navigation destinations.
- Vue Router, Pinia, and TanStack Query providers.
- Typed and runtime-validated HTTP boundary using Zod.
- Versioned custom JSON Server routes for authentication, reference data, compatibility, stocking
  estimates, cultivation creation/listing/details, daily dashboard/tasks, feeding completion,
  timelines, notifications, growth/mortality/water records, feeding plans, measurement-based harvest
  readiness and completion, product catalog/favorites, server-priced cart, checkout quotes,
  idempotent order placement, delivery tracking, personal/farm profiles, delivery addresses, and
  reminder preferences.
- Deterministic mock reset and demo provenance fields.
- Installable PWA manifest, generated service worker, offline indicator/fallback route, and update
  prompt.
- Unit, component, contract, and exact-target mobile end-to-end tests.

Phases 0-6 are complete, and on 2026-09-24 the same build passed the contract suite and all 13
journeys against FastAPI with only `VITE_API_BASE_URL` changed. The cultivation journey and supporting commerce experiences are API-backed.
Juan can follow daily guidance, record growth/mortality/water observations, review the feeding plan,
complete a measured harvest with an auditable summary, browse cultivation-context supplies, place an
idempotent mock order, follow its tracking timeline, and maintain farm/account preferences. Demo
guidance and derived biological values remain visibly labeled as estimates. See the
[release checklist](docs/release_checklist.md) for the remaining physical-device and public-release checks.

Read [AGENTS.md](AGENTS.md) and [the implementation plan](docs/implementation_plan.md) before adding features.
