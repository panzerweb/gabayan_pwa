# Gabayan MVP Release Checklist

Last verified: 2026-09-24

## Automated release gate

- [x] ESLint passes across application, mock API, and tests.
- [x] ESLint refuses `@tanstack/vue-query`, `@core/http` and `data/` imports in `src/pages/*/presentation/**/*.vue` (`tests/unit/core/vue-import-boundary.spec.ts`).
- [x] Vue/TypeScript strict type checking passes.
- [x] Unit and component suite passes: 222 tests.
- [x] Mock API contract suite passes: 10 tests.
- [x] Mobile Playwright suite passes: 13 journeys in Chrome at the primary `390 x 844 px` viewport.
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
| Application JavaScript      |  444.11 kB | 166.17 kB |
| Application CSS             |   77.80 kB |  25.22 kB |
| Entry chunk (`index-*.js`)  |  111.37 kB |  37.62 kB |
| Precached application shell | 511.03 KiB |       n/a |

Every route loads its page as a lazy chunk (`src/router/routes/*.routes.ts`); the service worker precaches all chunks, so offline navigation is unchanged. The per-file gzip total is higher than a single bundle would compress to, while the entry chunk a first visit downloads is less than half the former bundle.

## Backend replacement gate

- [x] Frontend HTTP calls use `VITE_API_BASE_URL` exclusively.
- [x] Every contract §5 path is declared once in `ENDPOINTS` (`src/core/url_paths.ts`), checked against the catalog by `tests/unit/core/url-paths.spec.ts`.
- [x] Pages and components do not call JSON Server or raw collections directly.
- [x] The public and sign-in screens reach the API only through their feature repositories (`src/pages/{public,auth}/data/`), on `ENDPOINTS`, and navigate by route name.
- [x] Request and response payloads are runtime-validated at the API boundary.
- [x] Contract tests cover auth, onboarding, operations, commerce, harvest, and profile resources.
- [ ] When FastAPI staging is available, set only `VITE_API_BASE_URL`, run the contract suite against staging, and execute the 13 critical browser journeys. This external deployment gate cannot be completed from the frontend/mock repository alone.
