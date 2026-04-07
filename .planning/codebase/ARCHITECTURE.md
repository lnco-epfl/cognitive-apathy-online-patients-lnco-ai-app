# Architecture

_Last updated: 2026-04-07_

## Summary

This is a Graasp-hosted React app that embeds a jsPsych experiment for measuring effort-based decision making (EBDM) in Parkinson's Disease patients. The app uses a thin React/Graasp shell to handle authentication, settings management, and data persistence, then hands off entirely to a jsPsych timeline for the actual experiment. All experiment state is managed by a central `ExperimentState` class instance that is passed through every jsPsych part and trial.

## Overall Pattern

**Two-layer architecture:**

1. **React/Graasp shell** (`src/modules/main/`, `src/modules/context/`, `src/modules/settings/`) — handles Graasp context (Builder vs. Player vs. Analytics), loads settings from the Graasp API, fetches and persists experiment results as AppData, and bootstraps the jsPsych experiment.
2. **jsPsych experiment core** (`src/modules/experiment/`) — entirely imperative, vanilla JS/TS timeline construction. No React inside the experiment. Once `run()` is called, jsPsych renders into a `#jspsych-display-element` div and React is no longer involved.

## React Shell Layers

**App Context Router:**
- Location: `src/modules/main/App.tsx`
- Reads Graasp `context` (Builder / Analytics / Player) and renders the appropriate view.
- Wraps everything in `SettingsProvider` and `ExperimentResultsProvider`.

**Settings Layer (`src/modules/context/SettingsContext.tsx`):**
- Purpose: Reads all experiment settings from Graasp AppSettings API and exposes them via React context.
- All settings are typed under `AllSettingsType`, split into sub-categories: `generalSettings`, `languageSettings`, `practiceSettings`, `calibrationSettings`, `validationSettings`, `taskSettings`, `agencyTaskSettings`, `photoDiodeSettings`, `keySettings`, `nextStepSettings`.
- Settings are stored/updated in Graasp as named AppSetting objects (one per category).
- Default values are defined in the context file itself.
- Consumed by: `ExperimentLoader`, passed into `run()` as `input.settings`.

**Results Layer (`src/modules/context/ExperimentContext.tsx`):**
- Purpose: Reads and writes experiment result data from Graasp AppData API.
- Uses `postAppData` / `patchAppData` from `@graasp/apps-query-client`.
- Each participant has a single AppData record of type `ExperimentResults` containing a `{ trials: TrialData[] }` payload.
- Also persists data locally to `localStorage` (keyed by `participantName`) as a fallback.

**Experiment Loader (`src/modules/main/ExperimentLoader.tsx`):**
- Central orchestrator between the React shell and jsPsych.
- Determines whether to start fresh, restore from a checkpoint, or show a "completed" message.
- Checkpoint detection logic: looks for `checkpoint` field in trial data; valid reload phases are `EBDM` (mid-task), `agency`, and `final-calibration`.
- Merges local and server data, picking whichever has more progress.
- Calls `run()` from `src/modules/experiment/experiment.ts` exactly once (enforced via `useRef`).
- Passes `updateDataPromise` callback back to jsPsych so the experiment can save data at each block end.

**Builder View (`src/modules/main/BuilderView.tsx` → `src/modules/main/AdminView.tsx`):**
- Admin-permission users see `AdminView` (settings configuration panel).
- Read-permission users see `PlayerView` (the experiment itself).

## jsPsych Experiment Architecture

**Entry Point (`src/modules/experiment/experiment.ts`):**
- Exports a single `async run()` function.
- Receives `assetPaths`, `input` (settings, previous results, participantName, optional `reloadObject`), and `updateDataPromise`.
- Instantiates `ExperimentState` from settings.
- Applies language, font size, and photodiode DOM setup.
- Constructs the top-level `timeline` array and calls `jsPsych.run(timeline)`.

**Experiment State (`src/modules/experiment/jspsych/experiment-state-class.ts`):**
- The `ExperimentState` class is the single source of truth for all mutable experiment data during a session.
- Holds: current phase, preferred tapping hand, median taps per calibration part, calibration pass/fail status, validation failure counts, block completion count, patch/save status, practice loop count.
- Passed by reference to every `buildXxx()` part function and every trial that needs to read or mutate state.
- Settings are frozen at construction time; state is mutable via setters.

**Experiment Phases (in timeline order):**

| Phase | Builder Function | Part File |
|-------|-----------------|-----------|
| 1. Introduction | `buildIntroduction()` | `src/modules/experiment/parts/introduction.ts` |
| 2. Practice | `buildPracticeTrials()` | `src/modules/experiment/parts/practice.ts` |
| 3. Calibration | `buildCalibration()` | `src/modules/experiment/parts/calibration.ts` |
| 4. Validation | `buildValidation()` | `src/modules/experiment/parts/validation.ts` |
| 5. EBDM Task Core | `buildTaskCore()` | `src/modules/experiment/parts/task-core.ts` |
| 6. Final Calibration | `buildFinalCalibration()` | `src/modules/experiment/parts/calibration.ts` |
| (Agency Task) | `buildAgencyTaskCore()` | `src/modules/experiment/parts/agency-task-core.ts` — **currently disabled/commented out** |

Each phase is appended to the top-level timeline as a nested timeline object. `on_timeline_start` callbacks update the progress bar label and write checkpoints into jsPsych data.

**Trial Construction Layer (`src/modules/experiment/jspsych/trials.ts`):**
- `generateTrialOrder(state)` — creates randomized sequence of `DelayType` blocks.
- `generateTaskTrialBlock(...)` — constructs a full block timeline: demo trials → offer accept/decline → tapping → success/failure feedback → Likert survey → break (if scheduled).
- Trials per block = `taskPermutationRepetitions × taskBoundsIncluded.length × taskRewardsIncluded.length`.

**Individual Trial Files (`src/modules/experiment/trials/`):**
- `tapping-task-trial.ts` — the core keyboard-tapping plugin trial (thermometer mechanic).
- `countdown-trial.ts` — countdown before each tapping trial.
- `success-trial.ts` — feedback screen after tapping.
- `likert-trial.ts` — Likert-scale questionnaire (asked after each block and at the end).
- `loading-bar-trial.ts` — animated loading bar shown between trials.
- `release-keys-trial.ts` — prompts participant to release held keys.
- `agency-tapping-task-trial.ts` — alternative tapping trial for the agency manipulation (unused in current build).

**jsPsych Helpers (`src/modules/experiment/jspsych/`):**
- `stimulus.ts` — generates all HTML stimulus strings (thermometer, offer display, instruction pages, etc.).
- `message-trials.ts` — factory for generic message/instruction trials.
- `calibration-trial.ts` — builds calibration tapping trials with median-tap calculation.
- `validation-trial.ts` — builds validation tapping trials with pass/fail logic.
- `keyboard.ts` — keyboard state tracking for multi-key hold-and-tap mechanic.
- `instruction-helpers.ts` — utilities for rendering instruction HTML lists.
- `instruction-modal.ts` — floating modal button that overlays instruction content mid-task.
- `speech.ts` — `SpeechManager` class and `withSpeechControls()` wrapper; uses Web Speech API for TTS on every instruction screen (PD accessibility feature).
- `finish.ts` — handles end-of-experiment cleanup.
- `i18n.ts` — initialises i18next with EN and FR translation resources.

## Configuration and Localization Flow

**Settings flow:**
```
Graasp AppSettings API
  → SettingsContext (React)
    → ExperimentLoader (passed as input.settings)
      → run() in experiment.ts
        → ExperimentState constructor
          → getXxxSettings() accessors used by trials
```

**Localization flow:**
- Translation files: `src/locales copy/en/ns1.json` and `src/locales copy/fr/ns1.json`.
- i18next instance is initialized in `src/modules/experiment/jspsych/i18n.ts`.
- Language is set by `i18n.changeLanguage(input.settings.languageSettings.language)` in `run()`.
- All user-facing strings are lazy-evaluated functions in `src/modules/experiment/utils/constants.ts` that call `i18n.t(...)` at call time (not at module load), ensuring they use the correct language after `changeLanguage`.
- `SpeechManager` in `src/modules/experiment/jspsych/speech.ts` is also initialized with the same language code.

## Data Persistence Flow

```
jsPsych trial data (in-memory DataCollection)
  → on_finish / after each block: updateDataWithSettings(jsPsych.data.get())
    → ExperimentLoader.updateData() callback
      → saveToLocalStorage() [localStorage, keyed by participantName]
      → setExperimentResult() [ExperimentContext]
        → patchAppData() [Graasp AppData API]
```

Data format stored: `{ rawData: { trials: TrialData[] }, settings: AllSettingsType }` inside a Graasp AppData record.

## Checkpoint / Resume System

- After each phase starts, the last trial's data gets a `checkpoint` field set to the phase name.
- After each EBDM block, the last trial gets `checkpointBlock` indicating how many blocks have completed.
- On reload, `ExperimentLoader` inspects trials for the latest checkpoint and constructs a `ReloadObject` with `phase`, `medianTaps`, `preferredHand`, `remainingTrialBlocks`, and `totalReward`.
- Valid resume phases: `EBDM` (mid-task resume with remaining block list), `final-calibration` (skips intro/practice/calibration/validation/task).
- Phases `introduction`, `practice`, `calibration`, `validation` are not resumable — restart from scratch.

## Error Handling

- Data save errors: `updateDataWithSettings` uses a 5-second timeout. If the Graasp PATCH fails or times out, `state.patchStatus` is set to `'failed'` and a UI warning is shown. The experiment continues regardless.
- Lost connection warning: `renderConnectionWarning()` in `src/modules/experiment/jspsych/stimulus.ts` renders a DOM overlay.
- Tab close: `beforeunload` handler triggers an emergency data save.
- Completed experiment: `ExperimentLoader` detects completion by checking if `finalCalibrationPart2Median` is present in the last medianTaps entry, and shows a static message instead of running the experiment again.

## Key Enums and Domain Types

Defined in `src/modules/experiment/utils/types.ts`:
- `DelayType` — `Sync | NarrowAsync | WideAsync` (agency manipulation: tap-to-feedback delay)
- `BoundsType` — `Easy | EasyMedium | Medium | MediumHard | Hard` (effort level)
- `RewardType` — `Low | LowMiddle | Middle | MiddleHigh | High` (reward level)
- `CalibrationPartType` — four calibration phases
- `ValidationPartType` — four validation difficulty levels
- `Phase` — experiment phase string union used for checkpoint and instruction modal state

Numerical values for each enum are in `src/modules/experiment/utils/constants.ts` (`DELAY_DEFINITIONS`, `BOUNDS_DEFINITIONS`, `REWARD_DEFINITIONS`).
