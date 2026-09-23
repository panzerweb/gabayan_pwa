# Gabayan MVP Release Checklist

Last verified: 2026-09-23

## Automated release gate

- [x] ESLint passes across application, mock API, and tests.
- [x] Vue/TypeScript strict type checking passes.
- [x] Unit and component suite passes: 14 tests.
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

Production build on 2026-09-23:

| Asset                       |        Raw |      Gzip |
| --------------------------- | ---------: | --------: |
| Application JavaScript      |  391.61 kB | 118.69 kB |
| Application CSS             |   76.65 kB |  12.14 kB |
| Precached application shell | 463.43 KiB |       n/a |

The current MVP stays in one application bundle. Route-level splitting is a post-MVP optimization if future profile, reporting, or marketplace features materially increase these figures.

## Backend replacement gate

- [x] Frontend HTTP calls use `VITE_API_BASE_URL` exclusively.
- [x] Pages and components do not call JSON Server or raw collections directly.
- [x] Request and response payloads are runtime-validated at the API boundary.
- [x] Contract tests cover auth, onboarding, operations, commerce, harvest, and profile resources.
- [ ] When FastAPI staging is available, set only `VITE_API_BASE_URL`, run the contract suite against staging, and execute the 13 critical browser journeys. This external deployment gate cannot be completed from the frontend/mock repository alone.
