---
phase: 10-target-zone-validation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/locales copy/fr/ns1.json
  - src/locales copy/en/ns1.json
  - src/modules/experiment/utils/constants.ts
  - src/modules/experiment/jspsych/stimulus.ts
  - src/modules/experiment/jspsych/validation-trial.ts
  - src/modules/experiment/parts/validation.ts
autonomous: true
requirements: [P10]
must_haves:
  truths:
    - "Validation instruction screen shows 'Entrainement 4' heading with GSD Phase 10 body text"
    - "Each validation level retries up to 3 times independently before moving to next level"
    - "Extra validation triggers when any level exhausts all 3 attempts"
    - "Extra validation block runs up to 3 Hard trials; 3 failures ends experiment early"
    - "Result screen ends experiment when validationSuccess is false"
  artifacts:
    - path: "src/modules/experiment/utils/constants.ts"
      provides: "MAX_VALIDATION_ATTEMPTS_PER_LEVEL and MAX_EXTRA_VALIDATION_ATTEMPTS constants"
      contains: "MAX_VALIDATION_ATTEMPTS_PER_LEVEL"
    - path: "src/modules/experiment/jspsych/validation-trial.ts"
      provides: "Per-level retry loop, extra validation with finishExperimentEarly, updated result screen"
    - path: "src/modules/experiment/parts/validation.ts"
      provides: "validationTrialExtra wired into buildValidation"
  key_links:
    - from: "validation-trial.ts loop_function"
      to: "state.failures[validationName]"
      via: "per-level counter check"
      pattern: "failures\\[validationName\\].*MAX_VALIDATION_ATTEMPTS_PER_LEVEL"
    - from: "validation-trial.ts validationTrialExtra"
      to: "finishExperimentEarly"
      via: "on_timeline_finish callback"
      pattern: "finishExperimentEarly"
    - from: "validation.ts buildValidation"
      to: "validationTrialExtra"
      via: "conditional_function gated on extraValidationRequired"
      pattern: "extraValidationRequired"
---

<objective>
Implement GSD Phase 10: target zone (blue bar) validation practice. Update instruction text and heading, replace global failure gating with per-level retry logic (3 attempts each), wire the extra validation block into the timeline, and make extra validation failures end the experiment early.

Purpose: Align validation practice with the GSD spec -- per-level retries give participants fair attempts at each difficulty, and the extra validation fallback properly terminates participants who cannot perform the task.

Output: Updated locale strings, new constants, refactored retry logic, wired extra validation block.
</objective>

<execution_context>
@.planning/quick/260408-jrh-implement-phase-10-target-zone-blue-bar-/260408-jrh-CONTEXT.md
</execution_context>

<context>
@src/modules/experiment/jspsych/validation-trial.ts
@src/modules/experiment/parts/validation.ts
@src/modules/experiment/jspsych/stimulus.ts
@src/modules/experiment/utils/constants.ts
@src/modules/experiment/jspsych/experiment-state-class.ts

<interfaces>
<!-- Key types and state shape the executor needs -->

From experiment-state-class.ts:
```typescript
type ValidationStateType = {
  failures: ValidationFailuresType;  // Record<ValidationPartType, number>
  validationSuccess: boolean;
  validationTargetFailures: number;
  validationHardFailures: number;
  extraValidationRequired: boolean;
};

// Methods:
increaseValidationFailures(validationPart: ValidationPartType): void;
increaseValidationTargetFailures(): void;
increaseValidationHardFailures(): void;
setExtraValidationRequired(required: boolean): void;
setValidationSuccess(successful: boolean): void;
getValidationSettings(): ValidationSettingsType;
```

From validation-trial.ts:
```typescript
export const handleValidationFinish = (data, validationStep, state, jsPsych): void;
export const createValidationTrial = (validationName, jsPsych, state, updateData, device): Trial;
export const validationResultScreen = (jsPsych, state, updateData): Trial;
export const validationTrialExtra = (jsPsych, state, updateData, device): Trial;
```

From constants.ts:
```typescript
export const MAX_VALIDATION_FAILURES = 7;  // currently used as global loop gate
export const UPDATE_MEDIAN_TAPS_THRESHOLD = 2;
```

From utils.ts:
```typescript
export const checkLastAgencyTrialSuccess = (jsPsych): boolean;  // true = success
```

From finish.ts:
```typescript
export const finishExperimentEarly = (jsPsych, onFinish): void;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update locale strings, constants, and instruction heading</name>
  <files>
    src/locales copy/fr/ns1.json,
    src/locales copy/en/ns1.json,
    src/modules/experiment/utils/constants.ts,
    src/modules/experiment/jspsych/stimulus.ts
  </files>
  <action>
1. In `src/locales copy/fr/ns1.json`, update the `VALIDATION_VIDEO_TUTORIAL_MESSAGE` value to:
   `"En maintenant la touche S enfoncée, tapez la touche L de manière répétée pour :\nAmener et maintenir la barre rouge dans la zone cible bleue.\nNe dépassez pas la zone cible bleu.\n<b>Restez à l'intérieur de la zone bleue !</b>\n\n{{WARNING_MESSAGES_INSTRUCTION}}"`
   (Use `<br>` instead of `\n` if the existing keys use `<br>` for line breaks -- check the surrounding keys for convention. The existing key uses `<br>` so use that.)

   Also add a new key `"VALIDATION_PRACTICE_HEADER"` with value `"Entraînement 4"`.

2. In `src/locales copy/en/ns1.json`, update `VALIDATION_VIDEO_TUTORIAL_MESSAGE` to an equivalent English translation:
   `"While holding the S key, tap the L key repeatedly to:<br>Bring and keep the red bar inside the blue target zone.<br>Do not overshoot the blue target zone.<br><b>Stay inside the blue zone!</b>"`

   Also add `"VALIDATION_PRACTICE_HEADER"` with value `"Practice 4"`.

3. In `src/modules/experiment/utils/constants.ts`:
   - Add `export const MAX_VALIDATION_ATTEMPTS_PER_LEVEL = 3;` near the existing `MAX_VALIDATION_FAILURES` constant (line ~94).
   - Add `export const MAX_EXTRA_VALIDATION_ATTEMPTS = 3;` immediately after.
   - Add a new locale accessor: `export const VALIDATION_PRACTICE_HEADER = (): string => i18n.t('VALIDATION_PRACTICE_HEADER');` near the other header functions (around line 371).

4. In `src/modules/experiment/jspsych/stimulus.ts`:
   - Import `VALIDATION_PRACTICE_HEADER` from constants (add to the existing import block).
   - In the `validationVideo()` template literal (~line 509), replace:
     `<h2>${CALIBRATION_HEADER()}</h2>` with `<h2>${VALIDATION_PRACTICE_HEADER()}</h2>`
   - Remove the `<h3>${CALIBRATION_PART()} 2</h3>` line entirely (the heading "Entrainement 4" is self-contained, no sub-heading needed).
   - If `CALIBRATION_HEADER` and `CALIBRATION_PART` are no longer imported anywhere else in this file, remove them from the import. Check first -- they ARE used elsewhere in stimulus.ts (in `calibrationInstructions` etc.), so keep them.
  </action>
  <verify>
    <automated>cd "C:/Users/mijsters/Documents/LNCOai/apps/cognitive-apathy-online-patients-lnco-ai-app" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - FR locale has updated VALIDATION_VIDEO_TUTORIAL_MESSAGE matching GSD Phase 10 text and new VALIDATION_PRACTICE_HEADER key
    - EN locale has equivalent English translation and VALIDATION_PRACTICE_HEADER key
    - constants.ts exports MAX_VALIDATION_ATTEMPTS_PER_LEVEL (3), MAX_EXTRA_VALIDATION_ATTEMPTS (3), and VALIDATION_PRACTICE_HEADER accessor
    - stimulus.ts validationVideo() renders "Entrainement 4" heading instead of "Calibration / Partie 2"
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement per-level retry logic and wire extra validation</name>
  <files>
    src/modules/experiment/jspsych/validation-trial.ts,
    src/modules/experiment/parts/validation.ts
  </files>
  <action>
**A. Per-level retry in `createValidationTrial` (validation-trial.ts)**

Refactor the `loop_function` in `createValidationTrial` (~line 221):

Current logic loops while `!checkLastAgencyTrialSuccess(jsPsych) && validationTargetFailures < MAX_VALIDATION_FAILURES`. Replace with per-level logic:

```typescript
loop_function() {
  // Preserve existing: increment global target failures counter (for analytics)
  if (
    !checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych) &&
    !checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych) &&
    !checkFlag(TrialTypes.TappingTask, 'success', jsPsych)
  ) {
    state.increaseValidationTargetFailures();
  }
  // Preserve existing: hard failure median reduction logic (unchanged)
  if (
    !checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych) &&
    !checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych) &&
    checkMercuryHeight(jsPsych) &&
    validationName === ValidationPartType.ValidationHard
  ) {
    state.increaseValidationHardFailures();
  }
  if (
    state.getState().validationState.validationHardFailures >=
      UPDATE_MEDIAN_TAPS_THRESHOLD &&
    validationName === ValidationPartType.ValidationHard &&
    state.getState().medianTaps.calibrationPart2 >= 15
  ) {
    state.setMedianTaps({
      ...state.getState().medianTaps,
      calibrationPart2: state.getState().medianTaps.calibrationPart2 - 5,
    });
  }
  // NEW: per-level retry -- loop while last trial failed AND fewer than MAX attempts
  return (
    !checkLastAgencyTrialSuccess(jsPsych) &&
    state.getState().validationState.failures[validationName] <
      MAX_VALIDATION_ATTEMPTS_PER_LEVEL
  );
},
```

Import `MAX_VALIDATION_ATTEMPTS_PER_LEVEL` and `MAX_EXTRA_VALIDATION_ATTEMPTS` from constants (add to existing import). Remove `MAX_VALIDATION_FAILURES` from the import ONLY if it is no longer used in this file -- check: it is still used in `validationResultScreen`, so keep it for now (will be updated below).

Also update the `conditional_function` on the outer timeline of `createValidationTrial` (~line 256). Currently it gates on `validationTargetFailures < MAX_VALIDATION_FAILURES`. Since levels now run independently, remove this conditional entirely (return `true` always, or remove the `conditional_function` property). Each level should always run -- the per-level loop handles retries internally.

**B. Update `handleValidationFinish` (validation-trial.ts)**

Replace the complex percentage-based failure calculation with the simpler per-level threshold:

```typescript
export const handleValidationFinish = (
  data: ValidationData,
  validationStep: ValidationPartType,
  state: ExperimentState,
  jsPsych: JsPsych,
): void => {
  if (
    !data.success &&
    !checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych) &&
    !checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych)
  ) {
    state.increaseValidationFailures(validationStep);
    if (
      validationStep !== ValidationPartType.ValidationExtra &&
      state.getState().validationState.failures[validationStep] >=
        MAX_VALIDATION_ATTEMPTS_PER_LEVEL
    ) {
      state.setExtraValidationRequired(true);
    } else if (
      validationStep === ValidationPartType.ValidationExtra &&
      state.getState().validationState.failures[validationStep] >=
        MAX_EXTRA_VALIDATION_ATTEMPTS
    ) {
      state.setValidationSuccess(false);
    }
  }
};
```

**C. Update `validationTrialExtra` (validation-trial.ts)**

Replace the `on_timeline_finish` callback. Instead of just adjusting the progress bar on 3 failures, call `finishExperimentEarly`:

```typescript
export const validationTrialExtra = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => ({
  timeline: [
    createValidationTrial(
      ValidationPartType.ValidationExtra,
      jsPsych,
      state,
      updateData,
      device,
    ),
  ],
  on_timeline_finish() {
    if (!state.getState().validationState.validationSuccess) {
      finishExperimentEarly(jsPsych, updateData);
    }
  },
});
```

Note: `handleValidationFinish` already sets `validationSuccess = false` when extra failures reach the threshold, so checking `validationSuccess` here is clean.

**D. Update `validationResultScreen` (validation-trial.ts)**

Update both `stimulus()` and `on_finish()` to also check `validationSuccess === false`:

```typescript
export const validationResultScreen = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    const { validationTargetFailures, validationSuccess } =
      state.getState().validationState;
    return validationTargetFailures < MAX_VALIDATION_FAILURES &&
      validationSuccess
      ? PASSED_VALIDATION_MESSAGE()
      : FAILED_VALIDATION_MESSAGE();
  },
  on_finish() {
    const { validationTargetFailures, validationSuccess } =
      state.getState().validationState;
    if (
      validationTargetFailures >= MAX_VALIDATION_FAILURES ||
      !validationSuccess
    ) {
      finishExperimentEarly(jsPsych, updateData);
    }
  },
});
```

**E. Wire `validationTrialExtra` into `buildValidation` (validation.ts)**

Import `validationTrialExtra` (add to existing import from `../jspsych/validation-trial`).

In `buildValidation()`, after the three `createValidationTrial` pushes and BEFORE `likertFinalQuestionAfterValidation`, add:

```typescript
// Extra validation block -- runs only if a level exhausted all attempts
validationTimeline.push({
  timeline: [
    validationTrialExtra(jsPsych, state, updateData, device),
  ],
  conditional_function() {
    return state.getState().validationState.extraValidationRequired;
  },
});
```

This wraps `validationTrialExtra` in a conditional that only fires when `extraValidationRequired` was set to true by `handleValidationFinish`.
  </action>
  <verify>
    <automated>cd "C:/Users/mijsters/Documents/LNCOai/apps/cognitive-apathy-online-patients-lnco-ai-app" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
    - createValidationTrial loop_function uses per-level failures[validationName] < MAX_VALIDATION_ATTEMPTS_PER_LEVEL instead of global validationTargetFailures < MAX_VALIDATION_FAILURES
    - createValidationTrial conditional_function removed (all levels always run)
    - handleValidationFinish uses simple threshold (MAX_VALIDATION_ATTEMPTS_PER_LEVEL / MAX_EXTRA_VALIDATION_ATTEMPTS) instead of percentage math
    - validationTrialExtra calls finishExperimentEarly on 3 extra failures (via validationSuccess check)
    - validationResultScreen checks both validationTargetFailures and validationSuccess
    - buildValidation() includes validationTrialExtra gated on extraValidationRequired, placed after the 3 levels and before likert
    - Global validationTargetFailures counter still increments (for analytics) but no longer gates retry loops
    - Hard failure median reduction logic preserved unchanged
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Manual trace of the validation flow:
   - Instruction screen shows "Entrainement 4" heading with Phase 10 body text
   - Easy level: runs trial, on failure retries up to 3 times total, then moves to Medium
   - Medium level: same independent retry logic
   - Hard level: same, plus median tap reduction on hard failures (preserved)
   - If any level hit 3 failures: extraValidationRequired = true, extra validation block runs
   - Extra validation: up to 3 Hard trials, 3 failures = finishExperimentEarly()
   - Result screen: shows pass/fail, ends experiment if failed
</verification>

<success_criteria>
- TypeScript compiles cleanly
- Instruction screen displays "Entrainement 4" heading and GSD Phase 10 FR/EN text
- Each validation level independently allows up to 3 attempts
- Extra validation triggers on any level with 3 failures
- Extra validation ends experiment on 3 failures via finishExperimentEarly
- Result screen handles both legacy validationTargetFailures gate and new validationSuccess flag
- Existing hard-failure median reduction logic is untouched
</success_criteria>

<output>
After completion, create `.planning/quick/260408-jrh-implement-phase-10-target-zone-blue-bar-/260408-jrh-SUMMARY.md`
</output>
