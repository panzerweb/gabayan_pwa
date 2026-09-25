# Gabayan MVP Release Checklist

Last verified: 2026-09-25

## Automated release gate

- [x] ESLint passes across application, mock API, and tests.
- [x] ESLint refuses `@tanstack/vue-query`, `@core/http` and `data/` imports in every `src/**/*.vue`, shared components and layouts included (`tests/unit/core/vue-import-boundary.spec.ts`).
- [x] Vue/TypeScript strict type checking passes.
- [x] Unit and component suite passes: 762 tests.
- [x] Mock API contract suite passes: 106 tests, and its coverage check exercises all 79 method-and-path rows of contract §5.
- [x] Mobile Playwright suite passes: 28 journeys in Chrome at the primary `390 x 844 px` viewport.
- [x] Responsive reflow check passes at 320, 360, 390, 412, and 430 px without horizontal overflow.
- [x] Production PWA build succeeds and emits the web manifest and service worker.
- [x] Formatting check passes.
- [x] Mock database can be restored exactly from the deterministic seed.

Run the gate with:

```powershell
pnpm check
pnpm test:e2e
pnpm format
pnpm mock:reset
```

## Accessibility and interaction

- [x] Exactly four authenticated primary navigation destinations remain present.
- [x] Forms use visible, associated labels and readable validation messages.
- [x] Status chips combine text, icon, and color.
- [x] Shared controls meet the 44 px minimum target; primary inputs/actions are approximately 52 px.
- [x] Modal focus trap, Escape close, and focus return have component coverage.
- [x] Authenticated and setup layouts expose keyboard skip navigation.
- [x] Global `:focus-visible` treatment is present for links, buttons, inputs, selects, and text areas.
- [x] Reduced-motion mode removes meaningful animation and transition durations.
- [x] Mobile layouts reflow at supported widths and remain usable with large text wrapping.
- [ ] Before a public release, repeat a manual VoiceOver/TalkBack spot check, OS-level 200% text-size check, and contrast review on the final deployment devices.

## PWA, offline, and update behavior

- [x] Manifest includes standalone display, portrait orientation, theme/background colors, and any-size regular/maskable icons.
- [x] Application shell and static assets are precached.
- [x] Reference and operational GET resources use bounded network-first runtime caches.
- [x] An explicit offline banner identifies potentially stale information.
- [x] High-impact writes—including checkout, mortality, water observations, growth, harvest, and profile changes—are not queued silently while offline.
- [x] Offline fallback route and service-worker update prompt are present.
- [x] Outdated service-worker caches are cleaned up and clients are claimed after activation.
- [ ] Before a public release, verify installation and update replacement on at least one physical Android device and one supported desktop browser.

## Performance snapshot

Production build on 2026-09-24 (raw and gzip summed over every emitted file):

| Asset                       |        Raw |      Gzip |
| --------------------------- | ---------: | --------: |
| Application JavaScript      |  503.70 kB | 191.22 kB |
| Application CSS             |   86.07 kB |  27.86 kB |
| Entry chunk (`index-*.js`)  |  104.28 kB |  35.49 kB |
| Precached application shell | 580.06 KiB |       n/a |

Every route loads its page as a lazy chunk (`src/router/routes/*.routes.ts`); the service worker precaches all chunks, so offline navigation is unchanged. The per-file gzip total is higher than a single bundle would compress to, while the entry chunk a first visit downloads is less than half the former bundle.

## Backend replacement gate

- [x] Frontend HTTP calls use `VITE_API_BASE_URL` exclusively.
- [x] Every contract §5 path is declared once in `ENDPOINTS` (`src/core/url_paths.ts`), checked against the catalog by `tests/unit/core/url-paths.spec.ts`.
- [x] Pages and components do not call JSON Server or raw collections directly.
- [x] Every screen reaches the API only through its feature repository (`src/pages/<feature>/data/`), on `ENDPOINTS`, and navigates by route name; `src/services/` no longer exists. A notification's deep link is resolved to a named route before it is followed.
- [x] Checkout sends one `Idempotency-Key` per order submission and reuses it when that submission is retried (`tests/component/cart/useCheckout.spec.ts`).
- [x] Feeding completion sends one `Idempotency-Key` per submission, reuses it on retry, and invalidates Home, tasks, detail, timeline and notifications through the `@core/query` map (`tests/component/cultivations/useCompleteTask.spec.ts`).
- [x] Growth, mortality, water-check and harvest writes send one `Idempotency-Key` per submission, reuse it on retry, and invalidate through the `@core/query` map (`tests/component/cultivations/useRecordGrowth.spec.ts`, `CultivationHarvestView.spec.ts`); their forms stay disabled offline with an explanation.
- [x] Cultivation creation sends one `Idempotency-Key` per visit to the review step, reuses it on retry, sends an above-range plan only with explicit confirmation, and invalidates Home, the cultivation list and detail, and the account tier through the `@core/query` map (`tests/component/setup/useCreateCultivation.spec.ts`); it stays disabled offline with an explanation. A refusal because the plan has no culture system left (403 `TIER_LIMIT_REACHED`) is explained with a way to the plans (`tests/component/setup/ReviewSetupView.spec.ts`).
- [x] Marking notifications read is optimistic, as contract §14 allows: every cached list shows the change at once, is restored with a message if the server refuses, and the lists and Home refresh afterwards; "Mark all read" on a filtered list marks only that category (`tests/component/notifications/NotificationsView.spec.ts`).
- [x] Request and response payloads are runtime-validated at the API boundary.
- [x] Contract tests cover auth, onboarding, operations, commerce, harvest, and profile resources.
- [x] The contract suite runs against any server: the in-process mock by default, another API when `CONTRACT_API_BASE_URL` names its root. It creates its own accounts, finds seeded records by name rather than id, and asserts the mock-only sign-in fixtures are refused anywhere but the mock (`tests/contract/support/client.mjs`).
- [x] The mock serves every §5 row, `PATCH /cultivations/{cultivationId}` (409 `CONFLICT` with `details.currentVersion` on a stale `If-Match`), `POST /tasks/{taskId}/reopen` and `POST /cultivations/{id}/feeding-records` included, and the species, culture-environment, compatibility and product-category reads are marked Public in §5.
- [x] The journeys assert no mock identifier, and Playwright starts and resets the mock API only when `VITE_API_BASE_URL` is unset or names it (`docs/guides/development_guide.md` "Running against another API"). Against the mock they start their own app and mock on ports 5174 and 3101 and never reuse a running server, so a `pnpm dev:all` left open cannot feed them stale data (`journeyServers` in `tests/e2e/support/api-target.ts`).
- [x] The contract suite also drives the app's own data layer - every `src/pages/*/data/*.api.ts` read, with its query string and Zod schema - against the server it targets (`tests/contract/pwa-client.contract.spec.mjs`); unknown response fields are dropped and a missing required one fails (`tests/unit/auth/auth.model.spec.ts`).
- [x] The journeys open the app on the API's loopback host (`127.0.0.1` for FastAPI), so the `SameSite=Lax` refresh cookie survives a reload (`tests/e2e/support/api-target.ts`).
- [x] With only `VITE_API_BASE_URL` set to FastAPI, the contract suite and the 13 critical browser journeys pass. Verified 2026-09-24 against `aqua-lens-api` commit `101702b` run locally as its README §5 describes (fresh database, `seed-demo --date 2026-09-23`, uvicorn on port 8000): contract suite 49 of 49 with 68 of 68 catalog rows exercised, and 13 of 13 journeys.
- [x] Plans are the API's to enforce: the plans, the account tier and upgrade requests go through `src/pages/tiers/data/`, a new account chooses its plan before setup, Profile shows the plan and its culture-system limit, and a route carrying `meta.tier` sends a farmer below it to the plans (`tests/unit/router/guards.spec.ts`, `tests/e2e/tiers.spec.ts`). Paid plans are requested, never charged (BLOCKERS D-7).
- [ ] The three tier rows of contract §5 and the 403 `TIER_LIMIT_REACHED` refusal pass against FastAPI. Waits for aqua-lens-api Phase 26; until then a FastAPI contract run leaves those rows unexercised and `tests/e2e/tiers.spec.ts` cannot pass there (the plan step itself still lets a new account continue on Free when the plans cannot be read).
- [ ] The six species of contract §7 - Lapu-lapu and Shrimp with their compatibility and stocking rules, and the revised Bangus, Tilapia and Hito profiles - pass against FastAPI. Waits for aqua-lens-api Phase 28; until then a FastAPI contract run fails the species profile tests (`tests/contract/scenarios/species.scenarios.mjs`) and `tests/e2e/species.spec.ts` cannot pass there.
- [x] Water quality has a feature of its own (`src/pages/water-quality/`): the setup wizard shows the suggested range of each of the seven parameters for the chosen species and culture system, with its explanation, basis and demo disclaimer, and never asks for a reading; a cultivation's water safety check evaluates typed readings through `POST /water-safety-checks`, which stores nothing, shows each status as label, icon and colour, and is disabled offline (`tests/component/water-quality/`, `tests/e2e/water-quality.spec.ts`).
- [ ] `GET /water-thresholds` and `POST /water-safety-checks` pass against FastAPI. Waits for aqua-lens-api Phase 30; until then a FastAPI contract run fails the water-quality scenarios (`tests/contract/scenarios/water-quality.scenarios.mjs`) and `tests/e2e/water-quality.spec.ts` cannot pass there. The setup journeys still pass: the ranges step shows its retry state and never blocks Continue.
- [x] The dimensions step opens the suggested pond or cage size and depth for the chosen species and culture system from `GET /sizing-guidance`, with its basis, sources and demo label, and can reopen it; an above-range stocking result names the extra area or volume the planned count needs from `additionalSpaceNeeded` (`tests/component/setup/SizingGuidancePanel.spec.ts`, `tests/e2e/pond-sizing.spec.ts`).
- [ ] `GET /sizing-guidance` and the `requiredSpace` and `additionalSpaceNeeded` estimate fields pass against FastAPI. Waits for aqua-lens-api Phase 32; until then a FastAPI contract run fails the sizing scenarios (`tests/contract/scenarios/sizing.scenarios.mjs`) and `tests/e2e/pond-sizing.spec.ts` cannot pass there. The other setup journeys still pass: the dialog shows its retry state, and a result without the space fields leaves the shortfall out.
- [x] "Buy now" on each recommended setup tool and on each product a safety check names for an out-of-range reading opens the product with the suggested quantity preset (`?quantity=`, kept within `maximumOrderQuantity`); the product shows its installation guide (cautions, numbered steps, demo disclaimer) when `installationGuide` is not null; the shop stays a header link and the bottom navigation keeps four items (`tests/component/marketplace/BuyNowButton.spec.ts`, `ProductInstallationGuide.spec.ts`, `tests/e2e/buy-now.spec.ts`).
- [ ] `ProductDetail.installationGuide` and `WaterReadingResult.recommendedProducts` pass against FastAPI. Waits for aqua-lens-api Phase 34; until then a FastAPI contract run fails the tools scenarios (`tests/contract/scenarios/tools.scenarios.mjs`) and `tests/e2e/buy-now.spec.ts` cannot pass there. Other screens are unaffected: both fields are optional in the PWA's schemas, so a product without a guide and a result without products render as before.
- [x] The Feed plan tab of a cultivation shows the feed for its current growth stage (feed type, protein, pellet size, feedings a day) with the demo disclaimer and a "Buy now" to each linked Feeds product, and links to the species' whole feed guide (`GET /species/{speciesId}/feed-guide`, all six species DEMO; `tests/component/feeds/`, `tests/contract/scenarios/feeds.scenarios.mjs`, `tests/e2e/feeds.spec.ts`).
- [ ] `GET /species/{speciesId}/feed-guide` passes against FastAPI. Waits for aqua-lens-api Phase 36; until then a FastAPI contract run fails the feeds scenarios and `tests/e2e/feeds.spec.ts` cannot pass there. The Feed plan tab still shows today's plan: an API without the route answers 404, so the feed card says there is no guide for the fish yet.
- [x] Reading Home or the notifications raises the reminders due for each stocked, open cultivation, once per cultivation, kind and slot: the day's feeding task with a `FEEDING_DUE` reminder at each feeding time, a `WATER_CHANGE_DUE` reminder for a partial change of the profile's percentage (30 %, demo) each interval, and a `HARVEST_APPROACHING` alert only once a current sample reaches the target band, with 120-150 days shown as a hint and the decision left to the grower; each follows its switch in reminder settings, which now say what each switch sends. The contract and journey suites pin the mock clock to `2026-09-23T07:30:00+08:00` (`MOCK_API_NOW`, `X-Mock-Now`; `tests/contract/scenarios/reminders.scenarios.mjs`, `tests/component/notifications/NotificationReminderDetail.spec.ts`, `tests/e2e/reminders.spec.ts`).
- [ ] Reminders pass against FastAPI. Waits for aqua-lens-api Phase 38; until then a FastAPI contract run fails the reminder scenarios, and `tests/e2e/reminders.spec.ts` also needs a way to set FastAPI's clock (BLOCKERS D-67). Other screens are unaffected: `Notification.reminder` is optional in the PWA's schema.
- [x] A Pro farmer keeps a water log per cultivation: seven labelled readings with units and suggested ranges, saved once per `Idempotency-Key`, each evaluated against the ranges when saved; a history newest first and a per-parameter trend flag each value out of range with label, icon and colour. The feed conversion ratio is read from the server, worked out from the feeding, growth and mortality records, with its basis, the ratio between samples and the demo disclaimer. Both routes carry `meta.tier: 'PRO'`, and the API refuses a Free account with 403 `FORBIDDEN` and `details.requiredTier` (contract §6 "Plan-gated routes"; `tests/contract/scenarios/pro-logs.scenarios.mjs`, `tests/component/cultivations/CultivationWaterLogView.spec.ts`, `CultivationFeedConversionView.spec.ts`, `tests/e2e/pro-logs.spec.ts`).
- [ ] Water-parameter logs and the feed conversion read pass against FastAPI. Waits for aqua-lens-api Phase 40; until then a FastAPI contract run fails the Pro scenarios (`tests/contract/scenarios/pro-logs.scenarios.mjs`) and `tests/e2e/pro-logs.spec.ts` cannot pass there. Other screens are unaffected: the two Pro screens show their retry state.
- [x] Weather alerts are read for the farm's municipality and province: Home shows a weather card below the cultivation guidance with each alert's kind and severity (label, icon and colour), its days, the forecast figure beside the demo threshold, the risk to the fish, a few steps and the demo disclaimer; each alert raises one `WEATHER_ALERT` notification carrying the same explanation; a farm without a location is asked to add it in the farm profile, and an unreadable forecast says so without failing Home. No alert asks for a full water replacement (contract §12 "Weather alerts"; `tests/contract/scenarios/weather-alerts.scenarios.mjs`, `tests/component/weather-alerts/`, `tests/e2e/weather-alerts.spec.ts`).
- [ ] Weather alerts pass against FastAPI with its fake weather adapter. Waits for aqua-lens-api Phase 42; until then a FastAPI contract run fails the weather scenarios (`tests/contract/scenarios/weather-alerts.scenarios.mjs`) and `tests/e2e/weather-alerts.spec.ts` cannot pass there. Other screens are unaffected: the Home weather card shows its retry state and notifications without `weatherAlert` still parse.
