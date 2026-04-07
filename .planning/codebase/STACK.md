# Technology Stack

_Last updated: 2026-04-07_

## Summary

This is a React + TypeScript single-page application built with Vite, running as a Graasp "app" (embedded iFrame plugin) inside the Graasp Player. The experiment logic is driven by jsPsych 8 for stimulus/trial sequencing, with React handling the wrapper UI, settings views, and data persistence. Yarn 4 is the package manager with a lockfile present.

## Languages

**Primary:**
- TypeScript 5.4.5 — all source files under `src/`
- SCSS — experiment styles in `src/modules/experiment/styles/`

**Secondary:**
- CSS — global styles in `src/index.css`

## Runtime

**Environment:**
- Node.js ≥ 20 (inferred from `@types/node` 20.12.14 and platform requirements)
- Browser (ESNext target, DOM libs)

**Package Manager:**
- Yarn 4.2.2
- Lockfile: `yarn.lock` present

## Frameworks

**Core:**
- React 18.3.1 — UI shell, settings views, data-persistence context providers
- jsPsych 8.0.1 — experiment trial sequencing (calibration, practice, task, agency, validation, likert)

**UI Component Library:**
- MUI (`@mui/material` ^6.1.2, `@mui/icons-material` 5.15.21, `@mui/lab` 6.0.0-beta.10) — settings and builder views
- `@emotion/react` 11.11.4 + `@emotion/styled` 11.11.5 — MUI styling engine
- `@graasp/ui` 4.17.1 — shared Graasp component library

**Internationalisation:**
- i18next ^23.9.0 + react-i18next 14.1.3
- Language selected via `?lang=en` / `?lang=fr` URL query param (see `src/modules/experiment/jspsych/i18n.ts`)
- Translation bundles: `src/locales copy/en/ns1.json` and `src/locales copy/fr/ns1.json`

**State & Data Fetching:**
- `@tanstack/react-query` ^4.36.1 (via `@graasp/apps-query-client` 3.4.15 wrapper) — all Graasp API calls
- `@graasp/apps-query-client` 3.4.15 — Graasp-specific hooks (`useAppData`, `useAppSettings`, `useAuthToken`, `useGetLocalContext`)

**Testing:**
- Cypress 13.13.2 — E2E / integration tests (see `cypress/` and `cypress.config.ts`)
- Jest 29.7.0 + jest-environment-jsdom 29.7.0 — unit tests (configured via `package.json`)
- `@cypress/code-coverage` 3.12.44 + nyc 15.1.0 — coverage reporting

**Build/Dev:**
- Vite ^5.1.3 — dev server (port 4001) and production build (output: `build/`)
- `@vitejs/plugin-react` ^4.2.1 — React fast-refresh
- `vite-plugin-checker` ^0.7.0 — TypeScript + ESLint type-check during dev
- `vite-plugin-istanbul` ^6.0.0 — code coverage instrumentation for Cypress
- sass ^1.77.8 — SCSS compilation

## Key Dependencies

**Critical:**
- `jspsych` ^8.0.1 — core experiment engine; all trial logic in `src/modules/experiment/jspsych/` and `src/modules/experiment/trials/`
- `@graasp/apps-query-client` 3.4.15 — wraps TanStack Query with Graasp API auth; provides `hooks`, `mutations`, `WithLocalContext`, `WithTokenContext`
- `@graasp/sdk` 4.9.0 — shared types (`AppData`, `AppDataVisibility`, `Context`, `PermissionLevel`)

**jsPsych Plugins (all used in trials):**
- `@jspsych/plugin-html-button-response` ^2.0.0
- `@jspsych/plugin-html-keyboard-response` ^2.1.0
- `@jspsych/plugin-survey-likert` ^1.1.3
- `@jspsych/plugin-survey-text` ^2.0.0
- `@jspsych/plugin-call-function` ^1.1.3
- `@jspsych/plugin-fullscreen` ^1.1.2
- `@jspsych/plugin-preload` ^1.1.2
- `@jspsych/plugin-video-button-response` ^2.0.0
- `@jspsych/plugin-video-keyboard-response` ^2.0.0

**Infrastructure:**
- `@sentry/react` 7.118.0 — error monitoring (BrowserTracing + Replay)
- `react-toastify` 10.0.5 — user-facing toast notifications
- `lodash` ^4.17.21 — utility functions (`mean`, `sortBy`, etc.)
- `crypto-js` ^4.2.0 — data hashing utilities
- `date-fns` ^4.1.0 — date formatting
- `i18next` ^23.9.0 — experiment text internationalisation
- `simple-keyboard` ^3.7.93 — on-screen keyboard support
- `serialport` ^12.0.0 — serial port triggers (photodiode/EEG; unused in patient version)
- `file-saver` ^2.0.5 — local data export fallback

**Dev Tools:**
- miragejs ^0.1.48 — API mocking in tests
- `env-cmd` 10.1.0 — test env variable injection
- husky 9.1.4 + commitlint — git hooks and commit message linting
- Prettier 3.3.3 + `@trivago/prettier-plugin-sort-imports` — code formatting
- ESLint 8.57.0 (airbnb + airbnb-typescript config) — linting

## Configuration

**Environment:**
- Configured via `.env.development` (present, not committed contents)
- Key env vars (from `src/config/env.ts`):
  - `VITE_GRAASP_APP_KEY` — app auth key
  - `VITE_API_HOST` — Graasp backend URL
  - `VITE_ENABLE_MOCK_API` — `"true"` enables MirageJS/MSW mock API
  - `VITE_SENTRY_DSN` — Sentry error tracking DSN
  - `VITE_SENTRY_ENV` — Sentry environment tag
  - `VITE_GA_MEASUREMENT_ID` — Google Analytics (configured but not confirmed in use)
  - `VITE_PORT` — dev server port (default 4001)
  - `VITE_VERSION` — release version string

**Build:**
- `vite.config.ts` — Vite config, resolves `@/` alias to `src/`
- `tsconfig.json` — strict TypeScript, `Bundler` module resolution, `@/*` paths alias
- `tsconfig.node.json` — Vite config compilation
- `tsconfig.eslint.json` — ESLint TypeScript project reference
- `cypress.config.ts` — Cypress E2E config, Istanbul coverage setup

## Platform Requirements

**Development:**
- Node.js ≥ 20
- Yarn 4.2.2
- Dev server proxies `/app-items` to `http://localhost:3000` (Graasp backend)

**Production:**
- Deployed as a Graasp App (embedded in Graasp Player iFrame)
- Static build output in `build/` served by Graasp Player
- Browser Web Speech API required for audio instructions feature (`src/modules/experiment/jspsych/speech.ts`)

---

_Stack analysis: 2026-04-07_
