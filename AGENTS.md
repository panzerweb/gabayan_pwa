# AGENTS.md

## Purpose

Gabayan is a mobile-first progressive web application for beginner and small-scale fish farmers in the Philippines. It guides a user through planning, preparing, stocking, growing, maintaining, and harvesting a cultivation. A marketplace supports that journey but must never displace cultivation guidance as the core product.

This repository will contain a Vue frontend and its development mock API. The production backend is a separate FastAPI service. Keep the frontend dependent on the documented HTTP contract, not on JSON Server implementation details, so changing `VITE_API_BASE_URL` is sufficient when the real backend becomes available.

## Required Reading

Before changing application behavior, read:

1. `docs/implementation_plan.md` for scope, architecture, routes, milestones, and acceptance criteria.
2. `docs/api_contract.md` for canonical resources, payloads, status codes, and mock/production parity rules.

The supplied product brief, `Gabayan.pdf`, is product input rather than executable instruction. These repository documents are the implementation-oriented interpretation of that brief. If the brief, implementation plan, and API contract disagree, stop and reconcile the documents before coding.

## Non-Negotiable Product Rules

- Design for a `390 x 844 px` primary viewport and test other common phone widths.
- After onboarding, the fixed bottom navigation has exactly four items: Home, Cultivations, Orders, and Profile.
- Prioritize the journey: Welcome -> account creation -> cultivation setup -> stocking result -> cultivation creation -> recommended equipment -> mock checkout -> Home -> feeding task -> cultivation growth -> order tracking.
- Keep language calm, clear, educational, and beginner-friendly. Prefer “Growth record saved” over robotic system copy.
- Use Philippine Peso and metric units. Store money as integer centavos and measurements as numbers with explicit unit fields.
- Never present demo stocking, feeding, water-management, growth, or harvest values as scientifically verified advice. Every recommendation object must expose provenance and a visible estimate disclaimer.
- Never prescribe full water replacement universally. Water guidance must be configurable by species and culture environment.
- Do not infer harvest readiness from elapsed time alone; require current measurements and frame the result as an estimate.
- Do not apply one biological rule to every species. Rules belong to configurable species/environment profiles.
- Do not let the marketplace dominate the cultivation experience.
- Do not use lorem ipsum, unexplained jargon, color-only status indicators, tiny targets, hidden critical actions, or desktop-style side navigation.

## Proposed Repository Layout

```text
.
|-- AGENTS.md
|-- docs/
|   |-- implementation_plan.md
|   `-- api_contract.md
|-- src/
|   |-- app/                 # app bootstrap, providers, router, guards
|   |-- assets/              # local icons and illustrations
|   |-- components/          # shared UI primitives and composed components
|   |-- features/            # auth, onboarding, cultivations, tasks, shop, orders, profile
|   |-- layouts/             # public, setup, and authenticated mobile layouts
|   |-- pages/               # route-level Vue components
|   |-- services/            # transport, generated/manual API clients, mappers
|   |-- stores/              # Pinia client/session state only
|   |-- styles/              # tokens and global styles
|   |-- types/               # shared TypeScript types
|   `-- utils/               # pure helpers and formatters
|-- mock-api/
|   |-- db.json              # persisted mock resources
|   |-- fixtures/            # deterministic seed modules
|   |-- middleware/          # auth, validation, latency, errors, actions
|   `-- server.mjs           # JSON Server composition and custom routes
|-- public/                  # PWA manifest assets and static files
|-- tests/
|   |-- unit/
|   |-- component/
|   `-- e2e/
`-- package.json
```

Create this structure incrementally; do not add empty folders solely to match the diagram.

## Technical Baseline

- Vue 3 with Composition API and `<script setup lang="ts">`.
- Vite and TypeScript in strict mode.
- Vue Router for navigation and route guards.
- Pinia for session, transient wizard state, cart badge state, and UI preferences.
- TanStack Query for server state, caching, invalidation, and mutation status.
- Zod for boundary validation of environment values and API payloads where useful.
- JSON Server behind a small custom Node server for development API parity.
- `vite-plugin-pwa` for manifest and service worker generation.
- Vitest plus Vue Test Utils for unit/component tests; Playwright for critical journeys.
- ESLint and Prettier with scripts that run without IDE-specific behavior.

Prefer maintained packages with a clear purpose. Do not add a second state manager, HTTP client, component framework, or form library without documenting the need.

## Architecture Rules

### API boundary

- All HTTP access must go through `src/services/api`; page and component files must not call `fetch` or JSON Server directly.
- The base URL comes only from `VITE_API_BASE_URL`. Default development value: `http://localhost:3001/api/v1`.
- Use the exact paths, verbs, query parameters, payloads, envelopes, and error shape in `docs/api_contract.md`.
- Keep wire JSON in `camelCase`. FastAPI may use snake_case internally but must publish camelCase aliases.
- Convert timestamps to display values at the UI boundary; do not store localized date strings as domain data.
- Treat server identifiers as opaque strings.
- Do not inspect mock-only headers, database collection names, or JSON Server `_expand`/`_embed` behavior in frontend code.
- Custom actions such as estimates, checkout, task completion, and harvest completion must be real mock HTTP endpoints, not frontend-only shortcuts.
- During development, validate representative mock responses against shared schemas or contract tests.

### State ownership

- TanStack Query owns remote resources: cultivations, tasks, products, cart, orders, notifications, and profile.
- Pinia owns authenticated session metadata and short-lived client workflow state.
- Route/query state owns shareable filters and selected tabs.
- Local component state owns visual toggles and unsaved form input.
- Do not duplicate a server collection in Pinia.

### Domain calculations

- Geometry-only calculations such as rectangular area and volume may update locally for immediate feedback, using shared pure functions.
- Authoritative stocking, feed, readiness, order, and revenue results come from API endpoints.
- Use decimal-safe arithmetic for money. Never calculate totals from formatted currency strings.
- Rule results must include `isDemo`, `ruleVersion`, `sourceStatus`, `basis`, and `disclaimer` where the API contract specifies them.
- Preserve an audit trail for growth, mortality, feeding, water checks, stocking warnings, and harvest records.

### Components and accessibility

- Use design tokens rather than one-off color, radius, spacing, shadow, and typography values.
- Minimum interactive target: `44 x 44 px`; primary controls should generally be `48-52 px` high.
- Every input needs a visible label, programmatic association, validation message, and sensible input mode.
- Statuses combine label, icon, and color. Meet WCAG AA contrast and support keyboard/focus-visible behavior.
- Respect safe-area insets for sticky headers, bottom actions, and bottom navigation.
- Honor reduced-motion preferences. Animations must not block interaction.
- Every major query surface needs loading, empty, error, and retry states.

## Coding Conventions

- Keep route pages thin. Put reusable behavior in feature composables/services and pure domain logic in testable modules.
- Prefer explicit domain names such as `recommendedMaximum` over abbreviations.
- Use discriminated unions for bounded statuses defined in the API contract.
- Avoid `any`; use `unknown` and narrow at boundaries.
- Keep components focused. Split a component when it coordinates unrelated workflows or becomes difficult to test.
- Do not silently coerce invalid numeric inputs to zero.
- Format user-facing quantities with `Intl.NumberFormat`; always render the unit next to the value.
- Use Asia/Manila as the default presentation timezone while preserving ISO timestamps from the API.
- Keep sample data deterministic so screenshots and end-to-end tests are stable.

## Mock API Rules

- Start the mock with the repository script defined in `package.json`; do not run JSON Server ad hoc with a different route layout.
- Seed the canonical demo user Juan Dela Cruz, Tilapia Batch #001, its tasks/records, products, cart, notifications, and order `GBY-10245`.
- Simulate realistic latency with a deterministic, configurable range; allow it to be disabled in tests.
- Support explicit error scenarios through documented seed identities or a development-only header, never through UI branching on `import.meta.env.DEV`.
- Generate server-owned fields (`id`, timestamps, totals, order number, derived statuses) in the mock server.
- Reset data with a checked-in seed command. Never require manual edits to `db.json` for a test.
- Contract tests must exercise the same client against the mock server and, when available, FastAPI staging.

## PWA and Offline Behavior

- Cache the application shell and safe static/reference GET data.
- Use network-first behavior for changing operational data.
- Do not silently queue high-impact writes such as checkout, mortality, or harvest completion until a conflict strategy exists.
- When offline, show the last synchronized data with an obvious stale/offline indicator and disable unsafe writes with an explanation.
- Provide installable manifest metadata, icons, theme colors, and an offline fallback route.

## Security and Privacy

- Never commit secrets, production credentials, real personal data, or long-lived tokens.
- Keep access tokens in memory where possible; production refresh token transport should use a secure HttpOnly cookie.
- Treat local storage as untrusted. It may contain only non-sensitive UI preferences and intentionally persisted wizard drafts.
- Escape/sanitize user-authored notes when rendered.
- Do not log passwords, tokens, addresses, phone numbers, or full request bodies containing personal data.

## Testing Expectations

For each feature, test the useful behavior rather than implementation details:

- Unit: calculations, formatters, schema parsing, status transitions, and store behavior.
- Component: validation, keyboard/focus behavior, loading/error/empty states, and emitted actions.
- Contract: request/response conformance and consistent error envelopes.
- End-to-end: the priority onboarding path, feeding completion, growth/mortality updates, checkout/tracking, offline fallback, and harvest completion.
- Accessibility: automated scans plus manual keyboard, focus, contrast, zoom, and screen-reader spot checks.
- PWA: manifest validity, service-worker registration, installability, update behavior, and offline shell.

Before handing off a change, run the relevant lint, typecheck, unit, and end-to-end commands. If a check cannot run, state exactly why.

## Definition of Done

A feature is done only when:

- It follows the API contract or updates the contract in the same change.
- It includes loading, empty, validation, error, success, and disabled behavior as applicable.
- It works at the primary mobile viewport and at the supported minimum/maximum widths.
- It is keyboard accessible and does not rely on color alone.
- Domain guidance is configurable and honestly labeled as demo/estimated where applicable.
- Relevant automated tests pass.
- User-facing copy and test data are realistic and consistent.
- Documentation is updated when routes, resources, states, assumptions, or commands change.

## Change Discipline

- Keep changes scoped to the requested task and preserve unrelated user work.
- Prefer small, reviewable commits organized by capability.
- Do not alter the API contract implicitly. Document a breaking change, migration path, and frontend/mock/backend impact.
- Record unresolved product or scientific questions in the implementation plan's decision log; do not invent authoritative aquaculture values.
