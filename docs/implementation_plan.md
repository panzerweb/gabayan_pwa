# Gabayan PWA Implementation Plan

## 1. Document Status

- Status: active implementation baseline; Phases 0-6 completed
- Product input: the 59-page Gabayan product brief supplied by the product owner
- Frontend: Vue 3 PWA
- Development API: JSON Server with custom middleware/actions
- Production API: separate FastAPI service (`aqua-lens-api`)
- Backend swap: done on 2026-09-24. With only `VITE_API_BASE_URL` changed to a local FastAPI
  (`aqua-lens-api` commit `101702b`, seeded with `seed-demo --date 2026-09-23`), the contract suite
  and all 13 browser journeys pass; `docs/release_checklist.md` records the counts
- Primary locale/market: Philippines
- Primary viewport: `390 x 844 px`

This plan translates the brief into a build sequence. Values related to aquaculture are demo data until reviewed and marked verified by a qualified domain source.

## 2. Product Outcome

Gabayan should help a beginner move through this emotional and operational path:

```text
Unsure -> Guided -> Prepared -> Confident -> Accomplished

Plan -> Prepare -> Stock -> Grow -> Maintain -> Harvest
```

The primary outcome is not “buy equipment.” It is “know what to do next in a fish cultivation and why.” The marketplace appears when it supports a cultivation need.

### Success criteria for the first release

- A new user can create an account and complete a four-step cultivation setup.
- The app explains whether the proposed fingerling count is below, within, or above a configurable demo range.
- A user can accept or adjust the plan, create the cultivation, and see setup recommendations.
- A user can add a recommended aerator, complete a mock checkout, and track the order.
- Home clearly shows the active cultivation, today's work, progress, and a contextual tip.
- A user can complete feeding, growth, mortality, and water-check records and see derived values update.
- A near-harvest cultivation provides cautious readiness guidance; the user can record a harvest and complete the cultivation.
- The app is installable, responsive, keyboard accessible, and has an honest offline experience.
- Replacing the mock server with FastAPI requires an environment URL change, not feature rewrites.

## 3. Scope

### In scope

- Splash, Welcome, sign-in, registration, and Google-auth placeholder flow.
- New-user setup introduction and skip/empty-dashboard path.
- Fish, environment, dimensions, fingerlings, stocking estimate, review, and creation.
- Success state and recommended equipment.
- Marketplace browse/search/filter, product details, cart, checkout, order success, order history, and tracking.
- Home dashboard, cultivation list/details, tasks, timeline, feeding plan/log, growth records/chart, mortality, water checks, harvest readiness/record/completion.
- In-app notifications and notification preferences.
- Profile, farm information, addresses, and placeholder entry points for payments/help/legal content.
- JSON mock API with deterministic data and behavior matching `api_contract.md`.
- PWA installability, app shell caching, offline indicator/fallback, and update handling.
- Accessibility, responsive behavior, and automated tests for critical paths.

### Deferred unless separately approved

- Real payments, courier integrations, inventory reservation, refunds, and seller tools.
- Real Google OAuth, SMS/email verification, password reset delivery, and push notifications.
- GPS, sensor/IoT integrations, weather feeds beyond the in-app weather alerts read from a daily forecast for the farm's municipality and province (contract §12 "Weather alerts"), disease diagnosis, image recognition, and community/social features.
- Scientific validation of stocking/feed/water/harvest rules.
- Multiple currencies, imperial units, localization beyond an English-first Philippines experience.
- Full offline write synchronization and conflict resolution.
- Production backend implementation and deployment.

## 4. Experience Architecture

### Primary navigation

After authentication/onboarding, the fixed bottom navigation contains exactly:

1. Home
2. Cultivations
3. Orders
4. Profile

Marketplace, cart, notifications, settings, and cultivation sub-sections are secondary routes, not new bottom-navigation items.

### Route map

| Area            | Route                                                         | Purpose                                     |
| --------------- | ------------------------------------------------------------- | ------------------------------------------- |
| Entry           | `/`                                                           | Resolve splash/session and redirect         |
| Entry           | `/welcome`                                                    | Product promise and entry CTAs              |
| Auth            | `/sign-in`                                                    | Existing-user sign-in                       |
| Auth            | `/create-account`                                             | Account creation                            |
| Auth            | `/forgot-password`                                            | Request a password-reset link/code          |
| Auth            | `/reset-password`                                             | Apply a valid reset token                   |
| Setup           | `/setup/plan`                                                 | Choose a plan after account creation        |
| Setup           | `/setup`                                                      | Setup introduction/skip                     |
| Setup           | `/setup/species`                                              | Step 1 of 5                                 |
| Setup           | `/setup/environment`                                          | Step 2 of 5                                 |
| Setup           | `/setup/water-ranges`                                         | Step 3 of 5; suggested water ranges only    |
| Setup           | `/setup/dimensions`                                           | Step 4 of 5                                 |
| Setup           | `/setup/fingerlings`                                          | Step 5 of 5                                 |
| Setup           | `/setup/stocking-result`                                      | Below/recommended/above result              |
| Setup           | `/setup/review`                                               | Editable cultivation summary                |
| Setup           | `/setup/success/:cultivationId`                               | Celebration and next step                   |
| Home            | `/app/home`                                                   | Daily guidance dashboard                    |
| Cultivations    | `/app/cultivations`                                           | Active/completed list and empty state       |
| Cultivations    | `/app/cultivations/:id`                                       | Overview tab                                |
| Cultivations    | `/app/cultivations/:id/tasks`                                 | Cultivation tasks                           |
| Cultivations    | `/app/cultivations/:id/growth`                                | Growth records/chart                        |
| Cultivations    | `/app/cultivations/:id/records`                               | Feeding, mortality, and water records       |
| Cultivations    | `/app/cultivations/:id/harvest`                               | Readiness and harvest recording             |
| Cultivations    | `/app/cultivations/:id/water-safety`                          | One-off water safety check, not saved       |
| Notifications   | `/app/notifications`                                          | Read/unread notifications with filters      |
| Recommendations | `/app/cultivations/:id/recommendations`                       | Setup-specific equipment                    |
| Marketplace     | `/app/marketplace`                                            | Browse/search/filter products               |
| Marketplace     | `/app/products/:id`                                           | Product detail and quantity selection       |
| Cart            | `/app/cart`                                                   | Server-backed cart                          |
| Checkout        | `/app/checkout`                                               | Address/payment review and quote            |
| Orders          | `/app/orders`                                                 | Main Orders destination                     |
| Orders          | `/app/orders/:id`                                             | Order details                               |
| Orders          | `/app/orders/:id/tracking`                                    | Delivery timeline                           |
| Profile         | `/app/profile`                                                | Main Profile destination                    |
| Profile         | `/app/profile/edit`                                           | Personal/farm information                   |
| Profile         | `/app/profile/addresses`                                      | Shipping addresses                          |
| Profile         | `/app/profile/notifications`                                  | Reminder settings and times                 |
| Profile         | `/app/plans`                                                  | Plans, limits and upgrade requests          |
| Support/legal   | `/app/help`, `/legal/about`, `/legal/privacy`, `/legal/terms` | Static/help content and policy entry points |

Route guards distinguish guest, authenticated-without-cultivation, and authenticated users. A signed-in existing demo user lands on Home. A newly registered user lands on Setup.

## 5. Frontend Architecture

### Stack

| Concern              | Choice                               | Reason                                                 |
| -------------------- | ------------------------------------ | ------------------------------------------------------ |
| UI                   | Vue 3 Composition API + TypeScript   | Typed, component-oriented baseline                     |
| Build                | Vite                                 | Fast local development and PWA integration             |
| Routing              | Vue Router                           | Nested layouts and route guards                        |
| Server state         | TanStack Query for Vue               | Cache, request status, retries, invalidation           |
| Client state         | Pinia                                | Session, wizard draft, UI preferences                  |
| Forms                | Native Vue forms + Zod schemas       | Explicit validation without premature framework weight |
| Charts               | Lightweight SVG component first      | Accessible and sufficient for one simple growth chart  |
| Icons                | One tree-shakeable outline icon set  | Consistent visual language                             |
| PWA                  | `vite-plugin-pwa`                    | Manifest and Workbox integration                       |
| Unit/component tests | Vitest + Vue Test Utils              | Vite-native testing                                    |
| End-to-end           | Playwright                           | Mobile viewport and critical flow automation           |
| Mock API             | JSON Server + custom Node middleware | Persistent resources plus contract-faithful actions    |

### Layering

```text
Route pages
  -> feature components/composables
    -> API service modules
      -> shared HTTP transport
        -> JSON Server now / FastAPI later
```

- Pages coordinate route-level data and layout.
- Components render reusable interactions.
- Composables coordinate feature behavior and mutations.
- Service modules are the only place aware of URLs and wire payloads.
- Mappers normalize transport data only when necessary; mock-specific fields are forbidden.
- Pure calculation/formatting helpers are isolated and unit tested.

### State map

| State                                      | Owner                       | Persistence                                        |
| ------------------------------------------ | --------------------------- | -------------------------------------------------- |
| Session/access token metadata              | Pinia                       | Memory; mock may optionally restore a demo session |
| Refresh token                              | Server cookie in production | HttpOnly secure cookie                             |
| Setup wizard draft                         | Pinia                       | Session storage until submission                   |
| Profile/cultivations/tasks/products/orders | TanStack Query              | Memory cache, refetched as configured              |
| Cart                                       | API resource + query cache  | Mock database / production database                |
| Marketplace filters                        | Route query                 | URL                                                |
| Notification/reminder preferences          | API resource                | Mock database / production database                |
| Theme/non-sensitive UI preference          | Pinia                       | Local storage                                      |

### API swap strategy

1. Both servers expose `/api/v1` and the same JSON shapes.
2. Frontend reads only `VITE_API_BASE_URL` and never imports mock modules.
3. The custom mock server implements action endpoints rather than forcing JSON Server's default collection routes into the UI.
4. A shared set of frontend Zod schemas and HTTP contract tests checks representative responses.
5. FastAPI publishes OpenAPI; once available, CI compares critical routes/schemas and can generate types into an isolated generated folder.
6. Authentication transport differences remain inside the HTTP client/interceptor layer.

## 6. Design System

### Foundations

- Deep aquatic blue: primary brand/actions.
- Fresh aqua/teal: secondary emphasis.
- Natural green: positive/healthy states.
- Warm amber: caution/overcapacity.
- Red: destructive/error states only.
- Soft off-white or pale blue-gray: application background.
- White: primary surfaces.
- Type: Inter or a locally/fallback-compatible readable sans-serif.
- Suggested card radius: `16-20 px`.
- Primary control height: `48-52 px`; minimum target: `44 px`.
- Spacing: tokenized 4/8 px scale.
- Respect `env(safe-area-inset-*)`.

### Initial reusable components

Buttons, icon buttons, fields, password/number/search inputs, selectable cards, species/environment/product/cultivation/task/order/notification/statistic cards, status chips, progress bar/ring, app header, bottom navigation, sticky action bar, tabs, modal, dialog, bottom sheet, snackbar/toast, skeleton, empty state, error state, and offline banner.

Every component must document and test default, focus, pressed, disabled, loading, error, and success states as applicable.

### Content rules

- Pair technical terms with sparse info affordances.
- Pair status color with icon and text.
- Keep disclaimers available at recommendation points without allowing them to overpower the task.
- Use inclusive “culture area” or “fish farming setup”; do not use “mariculture” as a universal term.
- Do not claim a fish is definitely harvest-ready based only on a date.

## 7. Core Data and Interaction Flows

### New-user cultivation setup

1. Register through `POST /auth/register`.
2. Load species and culture environments.
3. Save wizard choices locally while moving between four steps.
4. Calculate area/volume locally for instant display; request the authoritative mock estimate from `POST /stocking-estimates`.
5. Show `BELOW_RANGE`, `RECOMMENDED`, or `ABOVE_RANGE` with an estimate disclaimer.
6. If the user continues above range, collect explicit confirmation and include the acceptance in the create request.
7. Review/edit the plan and create through `POST /cultivations`.
8. Show success, then load `GET /cultivations/{id}/equipment-recommendations`.

### Daily task completion

1. Home requests its composed dashboard or parallel cultivation/task/notification summaries.
2. User marks a feeding task complete through `POST /tasks/{id}/complete` with feed amount and timestamp.
3. Server creates a feeding record, completes the task, and returns both resources.
4. Client invalidates today's tasks, cultivation feeding summary, and notifications.
5. UI announces “Feeding recorded” and visibly changes the card state.

### Growth and mortality

- Growth: append a dated sample; refresh latest measurement, chart, feeding plan, and harvest readiness.
- Mortality: append a dated record; server derives estimated live fish and refreshes feed/readiness outputs.
- Never rewrite historical measurements when a derived estimate changes.

### Cart and checkout

1. Add/adjust/remove server-backed cart items.
2. Request a checkout quote; the server owns prices, delivery fee, and totals.
3. Submit order with address/contact/payment selection and an idempotency key.
4. Server creates the order, snapshots products/prices/address, and clears purchased cart items.
5. Order tracking renders the returned event timeline.

### Harvest

1. Load readiness estimate with basis and caveats.
2. Record harvest quantity, weights, selling price, and notes.
3. Server calculates survival rate/revenue and transitions cultivation to `COMPLETED`.
4. UI shows a celebratory summary while retaining a route to the full record.

## 8. Mock API Design

The development server is more than a raw `json-server --watch` command. `mock-api/server.mjs` mounts JSON Server's router under `/api/v1`, then adds middleware for:

- bearer-token simulation and demo users;
- `/auth/*` actions;
- stocking estimates and compatibility checks;
- cultivation creation and derived summaries;
- task completion and generated feeding records;
- growth/mortality effects on live-count/feed estimates;
- equipment recommendations;
- cart totals, checkout quote, idempotent order creation, and tracking events;
- notification read actions;
- harvest completion;
- response envelopes, error format, latency, and deterministic IDs/timestamps in tests.

The checked-in seed must provide:

- New user with no cultivation.
- Existing user Juan Dela Cruz.
- Tilapia Batch #001: pond, `5 m x 4 m x 1.5 m`, `30 m3`, 500 stocked, 15 mortality, estimated 485 live fish, day 46/150, Growing.
- Three daily tasks with one completed scenario available.
- Growth samples ending at 180 g and a simple rising chart.
- Products including a pond aerator priced at PHP 1,299.00.
- Cart scenarios: empty and populated.
- Order `GBY-10245`, two items, Shipped, with tracking history.
- Read/unread cultivation and order notifications.
- A near-harvest cultivation fixture for readiness and completion tests.

Demo biological rules live in configuration fixtures, not in UI code, and include `isDemo`, `sourceStatus`, and `ruleVersion`.

## 9. Delivery Phases

### Phase 0 - Foundation and decisions

- Approve this plan and `api_contract.md`.
- Scaffold Vue/Vite/TypeScript, lint/format/test scripts, aliases, environment example, and CI baseline.
- Scaffold custom JSON Server and resettable seed.
- Add shared transport/error handling and contract smoke tests.

Exit: app and mock server start together; `/health` and one typed resource request pass.

### Phase 1 - Design system, layouts, and PWA shell

Status: completed on 2026-09-21. The shell-preview data is deterministic UI content, not
production-backed domain state.

- Tokens, typography, icons, responsive app frame, safe areas.
- Public/setup/authenticated layouts and four-item bottom nav.
- Reusable states, modal/sheet/toast primitives.
- Manifest, icons, service worker, offline fallback, and update prompt.

Exit: component states are testable, app installs in a production build, and shell works at target mobile sizes.

### Phase 2 - Authentication and onboarding

Status: completed on 2026-09-22. Authentication, setup drafts, estimates, cultivation creation,
and recommendations use the documented HTTP contract and mock server rather than frontend-only
fixtures.

- Splash/welcome, register/sign-in, validation/loading/error states.
- Setup introduction/skip path.
- Four-step wizard, geometry diagram, compatibility warning, stocking result states, review/edit, create, and success.

Exit: the complete priority setup path works from a reset seed and above-range acceptance is explicit.

### Phase 3 - Everyday cultivation experience

Status: completed on 2026-09-22. Home, cultivation detail/timeline, tasks, feeding completion,
and notifications now use the documented API boundary. Feeding completion is pessimistic and
idempotent, creates its linked record on the server, marks its task notification read, and
invalidates every dependent frontend query.

- Home dashboard, cultivation list/empty state/details/tabs/timeline.
- Daily tasks and feeding completion.
- Notifications list, filters, unread state, and task deep links.
- Contextual education and estimate disclaimers.

Exit: demo user sees coherent derived values; task completion updates every dependent surface.

### Phase 4 - Marketplace and orders

Status: completed on 2026-09-22. Cultivation-context recommendations now lead into a searchable,
filterable marketplace. Cart prices and totals are server-owned, checkout uses an expiring quote,
order creation is idempotent and clears the purchased cart, and both seeded and newly placed
orders use the same detail and tracking resources.

- Setup recommendations, marketplace search/category/filter/sort, details.
- Cart, quantity changes, totals, empty state.
- Checkout quote, mock order placement, success, list/detail/tracking.

Exit: recommended aerator -> cart -> checkout -> tracked order works without client-calculated totals.

### Phase 5 - Cultivation records and harvest

Status: completed on 2026-09-23. Growth, mortality, feeding, and water records now share the
versioned API boundary and refresh their dependent estimates. Harvest readiness requires a current
measurement, exposes its demo provenance and basis, and the idempotent harvest action creates an
auditable completion summary before moving the cultivation into the Completed view.

- Growth entry/chart, mortality records, water checks, feeding plan explanation.
- Readiness estimate, reminder/deep link, record harvest, completion summary.

Exit: growth/mortality affect derived outputs, and completed cultivation appears under Completed with an auditable summary.

### Phase 6 - Profile, resilience, and release hardening

Status: completed on 2026-09-23 for the mock-backed frontend. Personal/farm details, addresses,
reminder preferences, explicit offline write protection, keyboard/reduced-motion behavior, bounded
PWA caching, install/update metadata, and the cross-width regression suite are implemented. The
FastAPI swap followed on 2026-09-24: setting only `VITE_API_BASE_URL` to the FastAPI service ran the
contract suite and the 13 journeys with no feature code change (the journeys open the app on the
API's host so the refresh cookie stays same-site); see `docs/release_checklist.md`.

- Profile/farm info, addresses, notification settings and reminder times.
- Complete loading/empty/error/offline states.
- Accessibility audit, reduced motion, performance and bundle review.
- Cross-width/browser checks, PWA install/update/offline verification.
- Full contract and end-to-end regression suite.

Exit: release checklist passes and switching the API URL to a contract-compatible FastAPI staging service needs no feature code changes.

## 10. Test Matrix

| Level         | Required coverage                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Unit          | Area/volume, currency/units, schema parsing, result-state mapping, progress, cart display math, route guards        |
| Component     | Inputs, selectable cards, progress, modal/sheet focus, status chips, all async states                               |
| Contract      | Envelopes, errors, auth, estimate, cultivation create, task complete, records, quote/order, harvest                 |
| E2E           | New-user priority journey; skipped setup; existing-user Home; feeding; growth/mortality; checkout/tracking; harvest |
| Accessibility | Keyboard, visible focus, labels/errors, status redundancy, dialog focus trap/return, AA contrast, 200% zoom         |
| PWA           | Manifest, installability, service-worker update, offline shell, stale-data indicator, unsafe-write blocking         |
| Responsive    | 320, 360, 390, 412, and 430 px widths; portrait first; safe-area simulation                                         |

## 11. Observability and Analytics Boundaries

For development, use structured console logging behind an adapter. Production integrations are deferred, but reserve event names for:

- `setup_started`, `setup_step_completed`, `stocking_estimate_viewed`, `cultivation_created`
- `recommendation_viewed`, `product_added`, `checkout_started`, `order_placed`
- `task_completed`, `growth_recorded`, `mortality_recorded`, `water_check_recorded`
- `harvest_readiness_viewed`, `cultivation_completed`

Do not include passwords, tokens, phone numbers, addresses, free-text notes, or detailed health observations in analytics payloads.

## 12. Risks and Mitigations

| Risk                               | Mitigation                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Demo biology mistaken for advice   | Provenance fields, visible disclaimer, config isolation, review gate for `VERIFIED` status  |
| Mock/backend drift                 | Versioned contract, schemas, contract tests, OpenAPI comparison, no mock imports in UI      |
| Offline duplicate writes           | Disable unsafe writes offline initially; add idempotency keys for order/task/record actions |
| Derived values become inconsistent | Server-owned calculations, immutable event records, query invalidation map                  |
| Marketplace dilutes core promise   | Contextual entry, cultivation-first Home, no fifth nav item                                 |
| Mobile UI becomes dense            | Progressive disclosure, bottom sheets, concise cards, one primary action per view           |
| Notification fatigue               | User-controlled categories/times and grouped in-app notifications                           |
| Accessibility regressions          | Shared primitives, automated scans, keyboard/manual release checklist                       |

## 13. Open Decisions

These do not block the mock-first build, but must be resolved before production:

1. Qualified source and approval workflow for species/environment biological rules.
2. Supported Philippine regions and whether climate/location affects guidance.
3. Whether accounts can own multiple farms and whether staff roles are needed.
4. Production identity provider, verification, refresh-cookie, and account recovery design.
5. Marketplace operating model: owned catalog, affiliate links, or multi-seller marketplace.
6. Payment, delivery, cancellation, return, and refund policies.
7. Push notification provider and browser support targets.
8. Data retention/export/deletion requirements and the final privacy/legal text.
9. Offline record capture and conflict resolution policy.
10. Whether English-only ships first or Filipino/localized copy is required at launch.

## 14. Definition of MVP Complete

The MVP is complete when every Phase 0-6 exit criterion passes, the priority end-to-end journey is believable at `390 x 844 px`, all API calls conform to `api_contract.md`, all scientific-looking outputs are clearly marked by provenance, and a configuration-only API base URL change successfully runs the frontend against a contract-compatible FastAPI staging server.
