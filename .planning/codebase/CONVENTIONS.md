# Coding Conventions

_Last updated: 2026-04-07_

## Summary

The codebase uses TypeScript strict mode with the Airbnb ESLint ruleset extended with `@typescript-eslint/recommended`. Prettier enforces formatting. React components are arrow functions only. The experiment core (jsPsych layer) is written in plain TypeScript classes and modules, while the React wrapper is minimal.

---

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — e.g., `ResultsView.tsx`, `Loader.tsx`
- Non-component modules: camelCase `.ts` — e.g., `adoMath.ts`, `experiment-state-class.ts`, `calibration-trial.ts` (kebab-case also used for multi-word jspsych files)
- Config files: camelCase `.ts` — e.g., `appSettings.ts`, `queryClient.tsx`
- Style files: kebab-case `.scss` / `.css` — e.g., `main.scss`, `pd-accessibility.css`

**Functions:**
- camelCase for regular functions and arrow functions: `buildDataCy`, `createKeyboard`, `increaseMercury`
- UPPER_SNAKE_CASE for exported i18n message factory functions (those that wrap `i18n.t()`): `CONTINUE_BUTTON_MESSAGE`, `TRIAL_FAILED`, `GO_MESSAGE`
- Functions returning i18n strings follow a `SCREAMING_SNAKE_CASE()` convention — they are all zero-arg `() => string` factories or parameterised `(arg) => string` factories. This is intentional: they must be called at runtime (not import-time) so the language setting is current.

**Variables / Constants:**
- UPPER_SNAKE_CASE for pure numeric/string constants: `AUTO_DECREASE_AMOUNT`, `TRIAL_DURATION`, `NUM_CALIBRATION_TRIALS`
- camelCase for local variables and state: `tapCount`, `isRunning`, `mercuryHeight`
- Enum member names: PascalCase — `CalibrationPartType.CalibrationPart1`, `BoundsType.Easy`

**Types / Interfaces:**
- Suffix `Type` for type aliases: `TappingTaskParametersType`, `TappingTaskDataType`, `AllSettingsType`
- Suffix `Type` is also used on enum names: `CalibrationPartType`, `DelayType`, `BoundsType`
- Interface names without suffix: `State`, `CalibrationTrialParams`, `ParamSet`
- Mapped-type helper suffixes: `...SettingsType`, `...DataType`, `...ParamsType`

**Cypress selectors:**
- Constant suffix `_CY`: `PLAYER_VIEW_CY`, `BUILDER_VIEW_CY`
- Builder function `buildDataCy(selector)` returns `[data-cy=...]` string

---

## TypeScript Patterns

**Strict mode is on** (`"strict": true` in `tsconfig.json`). Target is `ESNext`.

**Path alias:** `@/*` maps to `src/*`. Use `@/modules/...` for cross-module imports.

**Enums are preferred over string unions** for experiment domain values:
```typescript
export enum BoundsType {
  Easy = 'easy',
  EasyMedium = 'easymedium',
  Medium = 'medium',
}
```

**Mapped types over enums for lookup tables:**
```typescript
export const BOUNDS_DEFINITIONS: { [key in BoundsType]: [number, number] } = {
  [BoundsType.Easy]: [5, 23],
  ...
};
```

**`type` vs `interface`:** both used; `type` for unions and aliases, `interface` for parameter objects (e.g., `CalibrationTrialParams`, `TaskTrialData`).

**`// eslint-disable-next-line @typescript-eslint/no-explicit-any`** appears only where jsPsych's dynamic timeline structures force it (e.g., `Timeline = any[]` in `src/modules/experiment/utils/types.ts`). Avoid adding new `any` escapes.

**Explicit return types enforced by ESLint** (`@typescript-eslint/explicit-function-return-type` is `error` with `allowExpressions: true`). All exported functions must declare their return type; inline arrow expressions inside function bodies are exempt.

**`no-param-reassign` exceptions:** jsPsych trial plugin callbacks directly mutate `trial.*` parameters; these are suppressed with inline `// eslint-disable-next-line no-param-reassign`. Minimise new uses.

---

## Code Style

**Formatter:** Prettier 3.3.3
- Single quotes: `true`
- Semicolons: `true`
- Trailing commas: `all`
- Tab width: 2 spaces
- End of line: `auto`

**Linter:** ESLint with `airbnb` + `airbnb-typescript` + `@typescript-eslint/recommended` + `prettier`

**Key enforced rules:**
- `react/function-component-definition`: named components must be arrow functions
- `@typescript-eslint/explicit-function-return-type`: error (with expression exceptions)
- `@typescript-eslint/no-shadow`: error (overrides base `no-shadow: off`)
- `@typescript-eslint/no-unused-vars`: warn; variables prefixed `_` are ignored
- `no-console`: error except `console.error`, `console.warn`, `console.debug`, `console.info`
- `react-hooks/rules-of-hooks`: error
- `react-hooks/exhaustive-deps`: warn
- `import/prefer-default-export`: off — named exports preferred
- `react/prop-types`: off — TypeScript types serve this purpose

---

## Import Organisation

Managed by `@trivago/prettier-plugin-sort-imports` with this order:
1. `^react` — React core
2. `^@?mui` — MUI components
3. `^@?graasp` — Graasp SDK / UI packages
4. `<THIRD_PARTY_MODULES>` — other npm packages (including `jspsych`)
5. `^@/` — internal path-alias imports (`@/modules/...`)
6. `^[./]` — relative imports

No import extensions for `.ts`, `.tsx`, `.js` files (enforced by `import/extensions`).

---

## Module Design

**Exports:** Named exports throughout. No default exports except React components (convention from Airbnb: React component files export a single default arrow function).

**Barrel files:** Not used. Import directly from the module file.

**jsPsych plugins** are implemented as ES classes with a static `info` object and a `trial()` method, following the jsPsych plugin API: `src/modules/experiment/trials/tapping-task-trial.ts`, `src/modules/experiment/trials/countdown-trial.ts`.

**Experiment part files** (`src/modules/experiment/parts/*.ts`) export factory functions that return jsPsych `Trial` or `Timeline` objects. They do not contain React.

**React context** used for experiment-wide settings: `src/modules/context/SettingsContext.tsx`, `src/modules/context/ExperimentContext.tsx`.

---

## Error Handling

- ESLint-caught errors surface as build/lint failures.
- Runtime errors in the experiment are shown as inline messages inside the jsPsych display element (e.g., `error-message` div).
- `ErrorBoundary.tsx` wraps the React app.
- Sentry is configured in `src/config/sentry.ts` for production error reporting.

---

## Comments

**JSDoc on exported functions and classes:** required for all public experiment API. Example pattern from `tapping-task-trial.ts`:
```typescript
/**
 * @class TappingTask
 * @description A custom jsPsych plugin that creates a task where...
 * @param {Object} jsPsych - The jsPsych instance
 * @method trial - Executes the trial...
 */
```

**Inline comments:** used to explain non-obvious jsPsych lifecycle or ESLint suppression rationale. All `eslint-disable` lines should have a reason visible from context.

**Section headers** in large files use a consistent block comment pattern:
```typescript
// --------------------------------
// Helper functions for calibration part
// --------------------------------
```

---

## i18n / Localisation

All user-facing strings go through `i18n.t()` via wrapper functions in `src/modules/experiment/utils/constants.ts`. These functions are named in UPPER_SNAKE_CASE and called at runtime, not at import time, to pick up the current language (EN/FR). Never inline string literals for participant-visible text.

```typescript
// Correct
export const CONTINUE_BUTTON_MESSAGE = (): string => i18n.t('CONTINUE_BUTTON_MESSAGE');

// Wrong
const button = 'Continue'; // do not hardcode
```
