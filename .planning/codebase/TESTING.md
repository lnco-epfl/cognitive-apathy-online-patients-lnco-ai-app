# Testing Patterns

_Last updated: 2026-04-07_

## Summary

The project has **no unit or integration tests of its own**. All testing infrastructure is Cypress-based (E2E). The three Cypress test files that exist are scaffold stubs inherited from the Graasp app starter template and test only that the React wrapper renders correctly for builder/player/analytics contexts — they do not test any experiment logic. Coverage is collected via Istanbul/nyc instrumentation of the Vite build during Cypress runs.

---

## Test Framework

**Runner:** Cypress (version from `package.json` devDependencies; config via `cypress/tsconfig.json`)

**Coverage:** `nyc` 15.1.0 + `vite-plugin-istanbul` for source instrumentation; `@cypress/code-coverage` for collection during E2E runs.

**Mocking layer:** `miragejs` is listed as a devDependency; the Graasp `@graasp/apps-query-client` mock database is wired up in `cypress/support/commands.ts`.

**Run commands:**
```bash
yarn test          # Start app in test mode + run Cypress headless (concurrently)
yarn test:ci       # Same, then print nyc coverage report
yarn cypress:open  # Open Cypress interactive runner (requires .env.test)
```

**Coverage report:**
```bash
yarn test:ci       # Prints text + text-summary to console
# nyc is configured to include src/**/*.{js,ts,jsx,tsx}, exclude *.d.ts
```

---

## Test File Locations

All test files live under `cypress/`:
```
cypress/
├── e2e/
│   ├── analytics/main.cy.ts   # Stub — analytics context render check
│   ├── builder/main.cy.ts     # Stub — builder context render check
│   └── player/main.cy.ts      # Stub — player context render check
├── fixtures/
│   ├── members.ts             # ANNA and BOB mock Member objects
│   └── mockItem.ts            # MOCK_SERVER_ITEM fixture
└── support/
    ├── commands.ts            # cy.setUpApi() custom command
    ├── component.ts           # (empty / placeholder)
    └── e2e.ts                 # Global setup: code-coverage import, ResizeObserver guard
```

No `*.test.ts` or `*.spec.ts` files exist anywhere in `src/`.

---

## What the Existing Tests Cover

### `cypress/e2e/player/main.cy.ts`
Visits `/` with `Context.Player` + `PermissionLevel.Write` and asserts that `[data-cy=player-view]` contains the text `'Player as write'`. This is a stub from the starter template; it does not exercise any experiment functionality.

### `cypress/e2e/builder/main.cy.ts`
Same pattern for `Context.Builder` + `PermissionLevel.Read`, asserting `[data-cy=builder-view]` contains `'Builder as read'`.

### `cypress/e2e/analytics/main.cy.ts`
Analogous stub for the analytics view.

---

## Custom Cypress Command

`cy.setUpApi(database, appContext)` defined in `cypress/support/commands.ts`:
- Runs in `window:before:load` hook
- Deletes the `graasp-app-cypress` IndexedDB database
- Sets `window.appContext` (member ID, item ID, API host, context, permission)
- Sets `window.database` (appData, appActions, appSettings, members, items)

This injects a mock Graasp context so the React app boots without a real backend.

**Type signature:**
```typescript
cy.setUpApi(
  database: Partial<Database>,
  appContext: Partial<LocalContext>,
): void
```

---

## Fixtures

`cypress/fixtures/members.ts` — two `Member` objects keyed `ANNA` (current member) and `BOB`, typed against `@graasp/sdk`'s `Member` interface.

`cypress/fixtures/mockItem.ts` — a single `MOCK_SERVER_ITEM` used as the Graasp item context for all tests.

---

## Coverage Configuration

In `package.json`:
```json
"nyc": {
  "all": true,
  "include": ["src/**/*.{js,ts,jsx,tsx}"],
  "exclude": ["src/**/*.d.ts"]
}
```

`vite-plugin-istanbul` instruments the source build in `--mode test`. Coverage data is written by `@cypress/code-coverage` during the Cypress run and then reported by `nyc`. **Effective coverage of experiment logic is 0%** because no Cypress tests exercise jsPsych trials.

---

## What Is Not Tested

The following areas have no test coverage at all:

- **All jsPsych trial classes and plugins** — `src/modules/experiment/trials/*.ts`
- **Experiment orchestration** — `src/modules/experiment/experiment.ts`
- **ADO adaptive design algorithm** — `src/modules/experiment/ado/adoMath.ts`, `adoSimulation.ts`, `ado-selector.ts`
- **Calibration, validation, practice, introduction, task-core logic** — `src/modules/experiment/parts/*.ts`
- **ExperimentState class** — `src/modules/experiment/jspsych/experiment-state-class.ts`
- **Speech/TTS manager** — `src/modules/experiment/jspsych/speech.ts`
- **Stimulus HTML generation functions** — `src/modules/experiment/jspsych/stimulus.ts`
- **i18n message factory functions** — `src/modules/experiment/utils/constants.ts`
- **React contexts** — `SettingsContext.tsx`, `ExperimentContext.tsx`

---

## Adding Tests

**For new unit tests** (recommended for ADO math, state class, utils):
The project has `jest` 29.7.0 and `jest-environment-jsdom` 29.7.0 listed as dependencies, and `@jspsych/test-utils` is available. No `jest.config.*` file exists yet — one would need to be created. The `@sucrase/jest-plugin` is available for TypeScript transpilation.

Suggested jest config starting point:
```javascript
// jest.config.js
export default {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.[jt]sx?$': '@sucrase/jest-plugin' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
```

**For new Cypress E2E tests** targeting experiment flows:
Use `cy.setUpApi()` from `cypress/support/commands.ts`. Add new `describe` blocks in `cypress/e2e/player/main.cy.ts` or create new files under `cypress/e2e/`. Selector constants are in `src/config/selectors.ts` (`buildDataCy`).

**Test data:** Add fixture data to `cypress/fixtures/` following the existing `members.ts` pattern (use `@graasp/sdk` types for proper typing).
