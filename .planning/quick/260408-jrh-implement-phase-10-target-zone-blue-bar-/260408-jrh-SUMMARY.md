# Quick Task 260408-jrh: implement phase 10 - target zone blue bar validation practice

**Completed:** 2026-04-08
**Commits:** 9a30cc2, 830e932

## What was done

### Task 1 — Locale strings, constants, instruction heading (9a30cc2)
- Added `VALIDATION_PRACTICE_HEADER` locale key (FR: "Entraînement 4", EN: "Practice 4")
- Updated `VALIDATION_VIDEO_TUTORIAL_MESSAGE` FR to GSD Phase 10 wording
- Updated `VALIDATION_VIDEO_TUTORIAL_MESSAGE` EN to matching English translation
- Added `MAX_VALIDATION_ATTEMPTS_PER_LEVEL = 3` and `MAX_EXTRA_VALIDATION_ATTEMPTS = 3` to constants.ts
- Added `VALIDATION_PRACTICE_HEADER()` accessor to constants.ts
- Updated `validationVideo()` in stimulus.ts to use `VALIDATION_PRACTICE_HEADER()` heading (was "Calibration / Partie 2")

### Task 2 — Per-level retry logic and extra validation wiring (830e932)
- `createValidationTrial` loop_function: switched from global `validationTargetFailures < MAX_VALIDATION_FAILURES` to per-level `failures[validationName] < MAX_VALIDATION_ATTEMPTS_PER_LEVEL`
- Removed the outer `conditional_function` from `createValidationTrial` — all 3 difficulty levels now always run
- `handleValidationFinish`: replaced percentage-math failure calculation with simple threshold (MAX_VALIDATION_ATTEMPTS_PER_LEVEL / MAX_EXTRA_VALIDATION_ATTEMPTS)
- `validationTrialExtra`: replaced progress bar reset with `finishExperimentEarly()` on `validationSuccess === false`
- `validationResultScreen`: checks both `validationTargetFailures >= MAX_VALIDATION_FAILURES` and `!validationSuccess` for end-experiment logic
- `buildValidation()`: wired `validationTrialExtra` into timeline, gated on `extraValidationRequired` state flag, positioned between Hard trial and Likert questionnaire
- Global `validationTargetFailures` counter still increments for analytics (unchanged)
- Hard-failure median reduction logic preserved unchanged

## Files changed
- `src/locales copy/fr/ns1.json`
- `src/locales copy/en/ns1.json`
- `src/modules/experiment/utils/constants.ts`
- `src/modules/experiment/jspsych/stimulus.ts`
- `src/modules/experiment/jspsych/validation-trial.ts`
- `src/modules/experiment/parts/validation.ts`
