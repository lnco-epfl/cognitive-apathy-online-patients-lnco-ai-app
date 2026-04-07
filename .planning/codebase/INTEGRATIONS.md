# External Integrations

_Last updated: 2026-04-07_

## Summary

This app integrates exclusively with the Graasp platform for data persistence and context. Experiment results (jsPsych trial data) are stored as Graasp AppData via a REST API authenticated with a bearer token. Sentry provides error monitoring in production. There are no direct third-party database, file storage, or analytics service integrations beyond what Graasp manages server-side.

## APIs & External Services

**Graasp Platform API:**
- Service: Graasp Backend (REST API, default `http://localhost:3000` in dev, production URL via env)
- Purpose: All app data persistence — reading/writing experiment results (`AppData`), reading/writing experiment settings (`AppSettings`), posting participant actions (`AppAction`), and retrieving the local context (item ID, member ID, permission level, language)
- SDK/Client: `@graasp/apps-query-client` 3.4.15 (wraps TanStack Query + Axios)
- Auth: Bearer token obtained via `hooks.useAuthToken`; context bootstrapped via `hooks.useGetLocalContext`
- Entry point: `src/config/queryClient.tsx` — calls `configureQueryClient({ API_HOST, GRAASP_APP_KEY, ... })`
- Env vars: `VITE_API_HOST`, `VITE_GRAASP_APP_KEY`

**Sentry:**
- Service: Sentry error monitoring (cloud)
- Purpose: Browser error tracking, performance tracing, session replay
- SDK/Client: `@sentry/react` 7.118.0 (`BrowserTracing` + `Replay` integrations)
- Initialisation: `src/main.tsx` — `Sentry.init({ ...generateSentryConfig() })`
- Config: `src/config/sentry.ts` — `generateSentryConfig()` constructs config from env vars
- Env vars: `VITE_SENTRY_DSN`, `VITE_SENTRY_ENV`
- Notes: DSN is suppressed when running under Cypress (`!window.Cypress && SENTRY_DSN`)

**Google Analytics (configured, not confirmed active):**
- Env var `VITE_GA_MEASUREMENT_ID` is read in `src/config/env.ts` and exported as `GA_MEASUREMENT_ID` but no GA SDK import is found in source; may be unused or handled by the Graasp Player host.

## Data Storage

**Databases:**
- All persistent data stored in Graasp via AppData API (Graasp manages its PostgreSQL server-side)
- AppData type: `experiment-results` (see `src/config/appData.ts`)
- Data shape: `ExperimentResult` (full jsPsych DataCollection, see `src/modules/config/appResults.ts`)
- Write flow: `ExperimentResultsProvider` in `src/modules/context/ExperimentContext.tsx`
  - First save: `mutations.usePostAppData()` → POST to Graasp API
  - Subsequent saves: `mutations.usePatchAppData()` → PATCH to Graasp API
  - Visibility: `AppDataVisibility.Member` (per-participant, private)

**File Storage:**
- No direct file storage integration; files would be handled by Graasp if needed
- Local fallback: `saveDataToLocalStorage(jsPsych)` in `src/modules/experiment/jspsych/finish.ts` writes jsPsych data to `window.localStorage` as a backup before final submission

**Caching:**
- TanStack Query in-memory cache (staleTime: 1000ms), configured in `src/config/queryClient.tsx`
- No Redis or external cache

## Authentication & Identity

**Auth Provider:**
- Graasp Auth (JWT/session managed by Graasp Auth service)
- Implementation: `WithLocalContext` and `WithTokenContext` React wrappers from `@graasp/apps-query-client` (see `src/modules/Root.tsx`)
- Token fetched with `hooks.useAuthToken`; context (memberId, itemId, permission) fetched with `hooks.useGetLocalContext`
- App key: `VITE_GRAASP_APP_KEY` env var

**Permission Model:**
- Graasp `PermissionLevel`: `Admin` (experimenter/builder), `Write`, `Read` (participant)
- Admin check in `src/modules/context/ExperimentContext.tsx`: only admins can read all participants' results via `allExperimentResultsAppData`

## Browser APIs

**Web Speech API (text-to-speech):**
- Built-in browser API, no external service
- Implementation: `src/modules/experiment/jspsych/speech.ts` — `SpeechManager` class
- Purpose: Audio instructions for PD patients; controls (Play/Pause/Restart/Stop + speed slider) overlaid on each jsPsych trial
- Language: French (`fr-FR`) or English (`en-US`) based on experiment language setting
- Graceful degradation: shows unsupported notice if `speechSynthesis` not available

**Web Serial API (hardware triggers):**
- Built-in browser API (requires Chrome/Edge, behind a flag in most browsers)
- Implementation: `src/modules/experiment/triggers/serialport.ts`, `src/modules/experiment/triggers/trigger.ts`
- Purpose: Photodiode/EEG trigger pulses for in-lab use; `serialport` npm package ^12.0.0 also present
- Patient version: Trigger infrastructure exists in code but is not active in the online patient deployment (no serial port in remote browser use)

## Monitoring & Observability

**Error Tracking:**
- Sentry (`@sentry/react` 7.118.0) — browser exceptions, unhandled rejections, performance traces, session replay
- Sample rates (production): traces 10%, replays 10%, error replays 100%
- Disabled under Cypress testing

**Logs:**
- `console.error` / `console.warn` for API errors (see `src/modules/Root.tsx` and `src/modules/context/ExperimentContext.tsx`)
- No structured logging library

## CI/CD & Deployment

**Hosting:**
- Deployed as a Graasp App embedded in the Graasp Player iFrame
- Build artefact: `build/` directory (static files) served by Graasp infrastructure

**CI Pipeline:**
- `renovate.json` present — automated dependency updates via Renovate bot
- No CI pipeline config file detected in the repository (no `.github/workflows/`, `.gitlab-ci.yml`, etc.)

## Mock API (Development & Testing)

**Mock Solution:**
- `@graasp/apps-query-client` provides `mockApi` with two backends:
  - `MockSolution.ServiceWorker` (MSW) — used in standalone dev mode (`VITE_ENABLE_MOCK_API=true`)
  - `MockSolution.MirageJS` — used in Cypress tests (`window.Cypress` present)
- Mock database: `src/mocks/db.ts` — `buildDatabase(mockMembers)` defines in-memory fixtures
- Worker directory: `public/` (MSW service worker)
- Activation: `MOCK_API` flag from `src/config/env.ts`

## Environment Configuration

**Required env vars:**
- `VITE_GRAASP_APP_KEY` — Graasp app registration key
- `VITE_API_HOST` — Graasp backend REST API URL
- `VITE_SENTRY_DSN` — Sentry project DSN (production)
- `VITE_SENTRY_ENV` — Sentry environment label

**Optional env vars:**
- `VITE_ENABLE_MOCK_API` — set to `"true"` to run without real Graasp backend
- `VITE_PORT` — dev server port (default 4001)
- `VITE_VERSION` — release version string
- `VITE_GA_MEASUREMENT_ID` — Google Analytics ID (configured, usage not confirmed)

**Secrets location:**
- `.env.development` file (present, not committed to git)

## Webhooks & Callbacks

**Incoming:** None
**Outgoing:** None — all data flow is request/response via Graasp REST API

---

_Integration audit: 2026-04-07_
