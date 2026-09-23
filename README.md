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

## Build the Android app with Capacitor

Do not package the normal `.env` value into an APK: inside Android, `localhost` refers to the
Android device, not the computer running the mock API.

For an Android Studio emulator:

```powershell
Copy-Item .env.android.example .env.android.local
pnpm dev:mock
pnpm android:sync
pnpm android:open
```

The Android-mode example uses `http://10.0.2.2:3001/api/v1`, the emulator alias for the host
computer. The debug manifest permits cleartext HTTP only for local development.

For a physical Android phone, replace `10.0.2.2` in `.env.android.local` with the computer's LAN
IPv4 address, keep both devices on the same network, and allow port 3001 through the development
machine's firewall. A release APK must use the HTTPS URL of the deployed FastAPI service; release
builds do not opt into cleartext traffic.

Every API request has a bounded timeout. If the API cannot be reached during startup, Gabayan now
continues to Welcome instead of remaining indefinitely on the web splash screen.

## Quality checks

```powershell
pnpm check
pnpm test:e2e
```

`pnpm check` runs linting, strict type checking, unit tests, mock contract tests, and the production PWA build. The end-to-end command starts the app and mock API automatically.

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
