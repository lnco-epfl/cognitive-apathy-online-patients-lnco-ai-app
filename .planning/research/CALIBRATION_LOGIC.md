# Calibration Logic Research

**Researched:** 2026-04-07
**Domain:** jsPsych tapping experiment — calibration flow and MTS (Max Tapping Speed) computation
**Confidence:** HIGH (all findings from direct source reading)

---

## Summary

The calibration system measures a participant's maximum tapping speed and stores a "median taps" value
per calibration part in `ExperimentState`. This value is used downstream to calculate the
`autoIncreaseAmount` for the thermometer bar in the main task, ensuring that a participant tapping at
their personal maximum exactly fills the bar.

Currently the system runs N trials per calibration part (N controlled by
`requiredTrialsCalibration[part]` in settings, default = 1), collects all successful tap counts, then
computes the statistical **median across all N trials at once** after the last trial succeeds. The new
requirement changes this to a **trial-by-trial adaptive seeding** where each trial's reference value
(the "median" used to scale the bar) is derived from the previous trial's actual tap count rather than
all trials pooled.

The final stored MTS (maximum tapping speed) value that drives the main task changes from the median
of N pooled trials to `max(Trial 2 taps, Trial 3 taps)`.

**Primary recommendation:** Add a new per-trial tap-count tracker to `ExperimentState`, replace the
`calculateMedianTapCount` call in `handleSuccessfulCalibration` with direct tap-count reads from the
last trial, and remove `FinalCalibrationPart1` from `buildFinalCalibration`.

---

## Current Flow (as-built)

### Data structures

```
ExperimentState.state.medianTaps: MedianTapsType
  // keyed by CalibrationPartType enum value
  {
    calibrationPart1:       number  // default 10
    calibrationPart2:       number  // default 10
    finalCalibrationPart1:  number  // default 10
    finalCalibrationPart2:  number  // default 10
  }

ExperimentState.state.currentCalibrationStepSuccesses: { [CalibrationPartType]: number }
  // counts successful (clean) trials per part; used to decide loop exit
```

### Trial loop exit condition

`createCalibrationTrial` wraps its timeline in a `loop_function` that keeps repeating until
`isCalibrationPartCompleted()` returns true:

```
isCalibrationPartCompleted(part, state)
  => state.requiredTrialsCalibration[part] <= state.currentCalibrationStepSuccesses[part]
```

`requiredTrialsCalibration` comes from settings (default 1 per part, configurable in
`CalibrationSettingsView`).

### How median is computed today

Every time a trial finishes cleanly (no early key tap, no early key release, and tap count above
minimum for final calibration), `handleSuccessfulCalibration` runs:

```typescript
// calibration-trial.ts  handleSuccessfulCalibration()
const numTrials = state.getRequiredSuccesses(calibrationPart);   // e.g. 3
state.incrementCalibrationSuccesses(calibrationPart);            // success counter +1

state.updateMedianTaps(
  calibrationPart,
  calculateMedianTapCount(calibrationPart, numTrials, jsPsych),  // <-- reads jsPsych data
);
```

`calculateMedianTapCount` (utils.ts):
```typescript
jsPsych.data.get()
  .filter({ task: taskType })
  .filter({ keysReleasedFlag: false, keyTappedEarlyFlag: false })
  .last(numTrials)   // last N successful trials for this part
  .select('tapCount')
  .median();
```

So after trial 1 of 3: `medianTaps[part]` = tapCount from trial 1 only (only 1 record).
After trial 2 of 3: `medianTaps[part]` = median(trial1, trial2).
After trial 3 of 3: `medianTaps[part]` = median(trial1, trial2, trial3). -- final stored value.

The value is **re-computed and overwritten after every successful trial**, but only the value after
the LAST trial persists into the main task.

### How medianTaps feeds into the main task

In `trials.ts`, every block trial's `autoIncreaseAmount` calls:
```typescript
autoIncreaseAmountCalculation(
  EXPECTED_MAXIMUM_PERCENTAGE,   // 100
  TRIAL_DURATION,                // 5000
  AUTO_DECREASE_RATE,            // 100
  AUTO_DECREASE_AMOUNT,          // 2
  state.getState().medianTaps.calibrationPart2,  // <-- the stored median
)
```

`autoIncreaseAmountCalculation` formula:
```
(EXPECTED_MAXIMUM_PERCENTAGE + (TRIAL_DURATION / AUTO_DECREASE_RATE) * AUTO_DECREASE_AMOUNT) / median
= (100 + (5000/100)*2) / median
= 200 / median
```

So the bar increase per tap = 200 / medianTaps. With `medianTaps = 20`, each tap raises the bar by
10 percentage points.

For the **calibration bar itself** (during calibration trials), `calibration-trial.ts` uses:
```typescript
state.getState().medianTaps[
  calibrationPart === CalibrationPartType.FinalCalibrationPart2
    ? CalibrationPartType.FinalCalibrationPart1   // uses part1 median to scale part2 bar
    : CalibrationPartType.CalibrationPart1         // uses part1 median to scale all other bars
]
```

Note: `FinalCalibrationPart2` reads `FinalCalibrationPart1`'s median (not its own) to set the bar
height during the final calibration with-feedback trials. This is the cross-part dependency that
needs care during refactoring.

### CalibrationPartType enum values

```typescript
enum CalibrationPartType {
  CalibrationPart1 = 'calibrationPart1',       // no-feedback warmup
  CalibrationPart2 = 'calibrationPart2',        // with-feedback
  FinalCalibrationPart1 = 'finalCalibrationPart1',   // final no-feedback
  FinalCalibrationPart2 = 'finalCalibrationPart2',   // final with-feedback
}
```

### buildCalibration (Phase 9) — current structure

```
calibrationSectionDirectionTrial           instruction screen
calibrationPart1InstructionTrial           instruction screen
calibrationTrial(CalibrationPart1)         N trials, no thermometer, loop until N successes
conditionalCalibrationTrial(Part1)         only runs if Part1 median < minimum
calibrationPart2InstructionTrial           instruction screen
calibrationTrial(CalibrationPart2)         N trials, with thermometer
conditionalCalibrationTrial(Part2)         only runs if Part2 median < minimum
```

### buildFinalCalibration (Phase 22) — current structure

```
finalCalibrationPart1InstructionTrial      instruction screen
calibrationTrial(FinalCalibrationPart1)    N trials, no thermometer
finalCalibrationPart2InstructionTrial      instruction screen
calibrationTrial(FinalCalibrationPart2)    N trials, with thermometer
```

---

## Proposed Changes

### New adaptive logic (researcher specification)

For a calibration section with exactly 3 trials:

| Trial | Bar seed (autoIncreaseAmount basis) | Stored after trial |
|-------|-------------------------------------|--------------------|
| 1     | Default seed = 20                   | tap count T1       |
| 2     | T1                                  | tap count T2       |
| 3     | max(T1, T2)                         | tap count T3       |
| Final MTS stored in state | — | max(T2, T3) |

The term "median" in the codebase becomes "MTS seed" for a given trial — not a statistical median
of past trials, but a reference value derived from prior trial performance.

For `buildFinalCalibration`: Part 1 (no-bar warmup) is removed entirely. Only Part 2 (with-bar)
remains, applying the same 3-trial adaptive logic.

### Key insight: per-trial vs. after-loop

The new logic requires knowing each individual trial's tap count **at the time the next trial
starts**. The current `calculateMedianTapCount` reads from `jsPsych.data` (post-hoc). The new
approach must also read from `jsPsych.data` per trial, but select only the single last successful
tap count rather than computing a median across N trials.

The simplest implementation: after each successful trial, store the raw tap count in a new
per-trial list on state, then derive the seed for the next trial from that list.

---

## Files That Need Changing

### 1. `src/modules/experiment/jspsych/experiment-state-class.ts`

**What:** Add per-part storage of individual trial tap counts (a list), and a computed MTS accessor.

**New state fields:**
```typescript
// In the State interface, add:
calibrationTrialTapCounts: { [key in CalibrationPartType]: number[] };

// Default:
calibrationTrialTapCounts[part] = []  for all parts
```

**New methods needed:**
```typescript
// Push a raw tap count for a single trial
pushCalibrationTapCount(part: CalibrationPartType, taps: number): void

// Get all recorded tap counts for a part
getCalibrationTapCounts(part: CalibrationPartType): number[]

// Compute the seed for the NEXT trial based on recorded counts so far
// Returns the value to use as `median` in autoIncreaseAmountCalculation
getCalibrationSeed(part: CalibrationPartType, defaultSeed: number): number
```

`getCalibrationSeed` logic:
```typescript
getCalibrationSeed(part, defaultSeed = 20): number {
  const counts = this.state.calibrationTrialTapCounts[part];
  const n = counts.length;  // number of trials already completed
  if (n === 0) return defaultSeed;           // Trial 1: use default
  if (n === 1) return counts[0];             // Trial 2: T1
  return Math.max(counts[n - 2], counts[n - 1]); // Trial 3+: max of last two
}
```

The final MTS to store in `medianTaps[part]` after all 3 trials:
```typescript
// After the loop completes (all required successes reached):
const counts = state.getCalibrationTapCounts(part);
const mts = Math.max(counts[counts.length - 2], counts[counts.length - 1]);
state.updateMedianTaps(part, mts);
```

**Also:** `defaultMedianTaps` currently initialises all parts to `10`. This should stay as-is
(it acts as the bar seed for calibration trials before any data exists — but under the new logic,
`getCalibrationSeed` overrides this dynamically at trial start, so the default 10 in state only
matters if the function is not used).

### 2. `src/modules/experiment/jspsych/calibration-trial.ts`

#### `handleSuccessfulCalibration` — replace median computation

**Current:**
```typescript
state.updateMedianTaps(
  calibrationPart,
  calculateMedianTapCount(calibrationPart, numTrials, jsPsych),
);
```

**New:**
```typescript
// Record raw tap count for this trial
const lastTapCount = getLastCalibrationTapCount(calibrationPart, jsPsych);
state.pushCalibrationTapCount(calibrationPart, lastTapCount);

// Update running MTS in medianTaps (used by the bar in subsequent trials)
// At this point, medianTaps[part] = the seed for the NEXT trial
state.updateMedianTaps(calibrationPart, state.getCalibrationSeed(calibrationPart, 20));

// After all required trials are done, set final MTS = max(T2, T3)
// This is handled in on_timeline_finish of calibrationTrial (see below)
```

A small helper `getLastCalibrationTapCount` is needed:
```typescript
function getLastCalibrationTapCount(
  calibrationPart: CalibrationPartType,
  jsPsych: JsPsych,
): number {
  return jsPsych.data
    .get()
    .filter({ task: calibrationPart })
    .filter({ keysReleasedFlag: false, keyTappedEarlyFlag: false })
    .last(1)
    .select('tapCount')
    .values[0] ?? 0;
}
```

#### `calibrationTrialBody.autoIncreaseAmount` — use dynamic seed

**Current:**
```typescript
autoIncreaseAmount() {
  return autoIncreaseAmountCalculation(
    EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
    TRIAL_DURATION,
    AUTO_DECREASE_RATE,
    AUTO_DECREASE_AMOUNT,
    state.getState().medianTaps[
      calibrationPart === CalibrationPartType.FinalCalibrationPart2
        ? CalibrationPartType.FinalCalibrationPart1
        : CalibrationPartType.CalibrationPart1
    ],
  );
}
```

**New:** The lookup key changes for `FinalCalibrationPart2` — since Part 1 of the final calibration
is removed, it should now reference its own part's tap count list directly. The pattern becomes:

```typescript
autoIncreaseAmount() {
  return autoIncreaseAmountCalculation(
    EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
    TRIAL_DURATION,
    AUTO_DECREASE_RATE,
    AUTO_DECREASE_AMOUNT,
    state.getState().medianTaps[calibrationPart],
    // medianTaps[calibrationPart] now holds the adaptive seed for the current trial
    // (set by getCalibrationSeed on the previous on_finish, or still at default for trial 1)
  );
}
```

But for Trial 1 (no prior data), `medianTaps[calibrationPart]` must already be initialised to the
default seed (20). This means `defaultMedianTaps` in `experiment-state-class.ts` must change from
`10` to `20` for all calibration parts, OR `getCalibrationSeed` must pre-populate `medianTaps`
before the loop starts (e.g. in `on_timeline_start` of `calibrationTrial`).

Recommended: initialise `medianTaps[part] = 20` at the start of each calibration part's timeline.

#### `calibrationTrial` — set final MTS after loop

**Add to `on_timeline_finish`:**
```typescript
on_timeline_finish() {
  // Compute final MTS from last two trial tap counts
  const counts = state.getCalibrationTapCounts(calibrationPart);
  if (counts.length >= 2) {
    const mts = Math.max(counts[counts.length - 2], counts[counts.length - 1]);
    state.updateMedianTaps(calibrationPart, mts);
  }
  updateData(jsPsych.data.get());
}
```

#### `createCalibrationTrial` loop count

The new logic is specified for **3 trials**. `requiredTrialsCalibration[part]` must be set to 3
for the affected parts. This is a settings value (already configurable) — document that it must be
set to 3 for both `CalibrationPart1`/`CalibrationPart2` (main calibration) and `FinalCalibrationPart2`
(final calibration). The existing `loop_function` logic (`isCalibrationPartCompleted`) does not need
to change — it already loops until `requiredSuccesses` trials are done.

### 3. `src/modules/experiment/parts/calibration.ts`

#### `buildFinalCalibration` — remove Part 1

**Current:**
```typescript
finalCalibrationTimeline.push(finalCalibrationPart1InstructionTrial(state));
finalCalibrationTimeline.push(calibrationTrial(jsPsych, state, FinalCalibrationPart1, ...));
finalCalibrationTimeline.push(finalCalibrationPart2InstructionTrial(state));
finalCalibrationTimeline.push(calibrationTrial(jsPsych, state, FinalCalibrationPart2, ...));
```

**New:**
```typescript
// Remove Part 1 entirely
finalCalibrationTimeline.push(finalCalibrationPart2InstructionTrial(state));
finalCalibrationTimeline.push(calibrationTrial(jsPsych, state, FinalCalibrationPart2, ...));
```

The `finalCalibrationPart1InstructionTrial` function in `calibration.ts` and `finalCalibrationPart1Stimuli`
in `stimulus.ts` become dead code — they can be removed or left dormant.

`buildCalibration` (Phase 9) does NOT change structurally — it still runs Part 1 then Part 2.
The adaptive logic will be the same for both parts.

### 4. `src/modules/experiment/utils/utils.ts`

`calculateMedianTapCount` will no longer be called by calibration code. It can be:
- Deleted if no other callers exist (verify with grep before deleting)
- Left in place as dead code until confirmed safe to remove

**Verify before deleting:**
```bash
grep -r "calculateMedianTapCount" src/
```

### 5. `src/modules/experiment/utils/constants.ts`

`NUM_FINAL_CALIBRATION_TRIALS_PART_1 = 3` — this constant becomes unused after Part 1 removal.
`NUM_CALIBRATION_WITHOUT_FEEDBACK_TRIALS = 4` — currently informational only (not used by the loop
logic, which reads from settings). Document for update if the settings default changes.

The new default seed value (20 taps) should be added as a named constant:
```typescript
export const CALIBRATION_DEFAULT_SEED_TAPS = 20;
```

---

## How `autoIncreaseAmount` Is Affected Downstream

### During calibration trials (calibration-trial.ts)

Currently `calibrationTrialBody.autoIncreaseAmount` always reads from `medianTaps[CalibrationPart1]`
(or `FinalCalibrationPart1` for the final with-feedback part). Under the new logic, it reads from
`medianTaps[calibrationPart]` directly — which now stores the adaptive seed for the NEXT trial after
each `on_finish`. This is the same state key, just updated differently.

Effect: The bar scales progressively harder as tap speed improves across trials. Trial 1 uses a
fixed reference of 20 taps; Trial 2 uses the actual Trial 1 speed; Trial 3 uses the better of
Trial 1 and 2 speeds.

### During main task trials (trials.ts)

```typescript
state.getState().medianTaps.calibrationPart2   // line 124 in trials.ts
```

This is read once per trial block to set bar scaling. Under the new logic, `medianTaps.calibrationPart2`
will hold `max(T2, T3)` from main calibration Part 2. **No change needed to `trials.ts`** — the same
state key, now populated with the max instead of the median.

### During final task (post-final-calibration)

The final calibration stores its MTS in `medianTaps.finalCalibrationPart2`. Check whether any
downstream code reads `finalCalibrationPart2` or `finalCalibrationPart1` for task scaling.

Current `trials.ts` reads `calibrationPart2` (not final calibration keys), so the main task is
unaffected. However, verify that no validation trial or agency task reads `finalCalibrationPart1`:

```bash
grep -r "finalCalibrationPart1\|FinalCalibrationPart1" src/ --include="*.ts"
```

The `calibrationTrialBody.autoIncreaseAmount` currently has the special case:
```typescript
calibrationPart === CalibrationPartType.FinalCalibrationPart2
  ? CalibrationPartType.FinalCalibrationPart1   // <-- reads removed part's key
  : CalibrationPartType.CalibrationPart1
```
After Part 1 removal, `FinalCalibrationPart2` trials should reference `FinalCalibrationPart2`'s
own adaptive seed. This special-case branch must be removed.

---

## Implementation Order (Recommended)

1. **`experiment-state-class.ts`** — add `calibrationTrialTapCounts` state field, `pushCalibrationTapCount`,
   `getCalibrationTapCounts`, `getCalibrationSeed` methods. Change `defaultMedianTaps` to 20 or add
   `on_timeline_start` seeding.
2. **`constants.ts`** — add `CALIBRATION_DEFAULT_SEED_TAPS = 20`.
3. **`calibration-trial.ts`** — update `handleSuccessfulCalibration` (push tap count, update adaptive seed),
   update `calibrationTrialBody.autoIncreaseAmount` (remove `FinalCalibrationPart1` special case, use
   `medianTaps[calibrationPart]`), update `calibrationTrial.on_timeline_finish` (set final MTS).
4. **`calibration.ts`** — remove Part 1 from `buildFinalCalibration`.
5. **Cleanup** — verify and remove `calculateMedianTapCount` if unused; remove dead Part 1 instruction
   stimulus functions; remove `NUM_FINAL_CALIBRATION_TRIALS_PART_1` if unused.

---

## Edge Cases and Pitfalls

### Only 1 or 2 successful trials
If `requiredTrialsCalibration[part]` is set to fewer than 3, `max(T2, T3)` cannot be computed.
The final MTS code must guard: if `counts.length < 2`, fall back to `counts[counts.length - 1]` or
the default seed. Document this assumption clearly in code.

### Conditional calibration trial (retry path)
`createConditionalCalibrationTrial` resets success counters to 0 and re-runs calibration. The
`calibrationTrialTapCounts` list for that part must also be cleared at reset time, so the adaptive
seed logic restarts cleanly. Add `state.clearCalibrationTapCounts(calibrationPart)` alongside
`state.updateCalibrationSuccesses(calibrationPart, 0)`.

### FinalCalibrationPart1 enum value persists
Even after removing the Part 1 trials, `CalibrationPartType.FinalCalibrationPart1` still exists in
the enum. `defaultMedianTaps` and `defaultCurrentTrialsCalibration` still initialise it. This is
harmless but produces dead state. Leave the enum value to avoid breaking any stored data references.

### `calculateMedianTapCount` import
`calibration-trial.ts` currently imports `calculateMedianTapCount` from `utils`. After the change,
this import will be unused — TypeScript will warn. Remove the import.

### The `numTrials` argument to `handleSuccessfulCalibration`
`handleSuccessfulCalibration` currently receives `numTrials = state.getRequiredSuccesses(calibrationPart)`
and passes it to `calculateMedianTapCount`. After the change, `numTrials` is no longer needed for
median computation. The variable can be removed unless it is still used for the pass/fail check
(it is not — only `state.incrementCalibrationSuccesses` and the minimum tap check remain).

---

## Constants Reference

| Constant | Value | Role |
|----------|-------|------|
| `NUM_CALIBRATION_WITHOUT_FEEDBACK_TRIALS` | 4 | Informational; actual loop count from settings |
| `NUM_CALIBRATION_WITH_FEEDBACK_TRIALS` | 3 | Informational; actual loop count from settings |
| `NUM_FINAL_CALIBRATION_TRIALS_PART_1` | 3 | Will become unused |
| `NUM_FINAL_CALIBRATION_TRIALS_PART_2` | 3 | Will become unused |
| `MINIMUM_CALIBRATION_MEDIAN` | 10 | Min tap threshold for pass/fail check — unchanged |
| `EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION` | 50 | Bar target for calibration trials |
| `TRIAL_DURATION` | 5000 | Trial length in ms |
| `AUTO_DECREASE_RATE` | 100 | Used in `autoIncreaseAmountCalculation` |
| `AUTO_DECREASE_AMOUNT` | 2 | Used in `autoIncreaseAmountCalculation` |
| `defaultMedianTaps[*]` | 10 | Must change to 20 (the new default seed) |

---

## Sources

All findings are from direct file reads (HIGH confidence):
- `src/modules/experiment/jspsych/calibration-trial.ts`
- `src/modules/experiment/jspsych/experiment-state-class.ts`
- `src/modules/experiment/parts/calibration.ts`
- `src/modules/experiment/utils/constants.ts`
- `src/modules/experiment/utils/utils.ts`
- `src/modules/experiment/jspsych/trials.ts`
- `src/modules/experiment/utils/types.ts`
- `src/modules/context/SettingsContext.tsx`
