# Gabayan PWA

Gabayan is a mobile-first guide for beginner and small-scale fish farmers in the Philippines. The frontend is a Vue 3 progressive web app. Development uses a contract-faithful JSON Server API that can later be replaced by the separate FastAPI service through one environment variable.

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

## Quality checks

```powershell
pnpm check
pnpm test:e2e
```

`pnpm check` runs linting, strict type checking, unit tests, mock contract tests, and the production PWA build. The end-to-end command starts the app and mock API automatically.

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

Phases 0-6 are complete for the mock-backed frontend. The cultivation journey and supporting commerce experiences are API-backed.
Juan can follow daily guidance, record growth/mortality/water observations, review the feeding plan,
complete a measured harvest with an auditable summary, browse cultivation-context supplies, place an
idempotent mock order, follow its tracking timeline, and maintain farm/account preferences. Demo
guidance and derived biological values remain visibly labeled as estimates. See the
[release checklist](docs/release_checklist.md) for the remaining external staging and physical-device
deployment gates.

Read [AGENTS.md](AGENTS.md) and [the implementation plan](docs/implementation_plan.md) before adding features.
