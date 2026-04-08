---
phase: 09-calibration-adaptive-median
plan: "01"
subsystem: calibration
tags: [calibration, adaptive-seed, experiment-state, typescript]
dependency_graph:
  requires: []
  provides: [adaptive-calibration-part2-seed, calibration-state-tracking]
  affects: [src/modules/experiment/jspsych/calibration-trial.ts, src/modules/experiment/jspsych/experiment-state-class.ts]
tech_stack:
  added: []
  patterns: [adaptive-seed-per-trial, state-accumulation]
key_files:
  created: []
  modified:
    - src/modules/experiment/utils/constants.ts
    - src/modules/experiment/jspsych/experiment-state-class.ts
    - src/modules/experiment/jspsych/calibration-trial.ts
decisions:
  - "Adaptive seed overrides happen in handleSuccessfulCalibration after the standard median calculation so the final stored MTS equals max(T2,T3) not the statistical median"
  - "pushCalibrationPart2TapCount called after handleSuccessfulCalibration in on_finish to ensure accurate tap count recording only on valid trials"
metrics:
  duration_minutes: 10
  completed_date: "2026-04-08T07:43:46Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 9 Plan 01: Adaptive CalibrationPart2 Seed Logic Summary

**One-liner:** Per-trial adaptive seeding for CalibrationPart2 bar scaling using T1=20, T2=T1taps, T3=max(T1,T2), final MTS=max(T2,T3).

## What Was Built

Replaced the static median-based bar scaling for CalibrationPart2 with a researcher-confirmed adaptive algorithm. The red bar height now scales trial-by-trial based on the participant's actual tap performance, making calibration more accurate and individually tailored.

### Changes

**`src/modules/experiment/utils/constants.ts`**
- Added `CALIBRATION_DEFAULT_SEED_TAPS = 20` — the fixed seed for Trial 1 of CalibrationPart2.

**`src/modules/experiment/jspsych/experiment-state-class.ts`**
- Added `calibrationPart2TapCounts: number[]` to `State` interface, constructor init, and `resetState()`.
- Added `pushCalibrationPart2TapCount(tapCount)` — records each trial's tap count.
- Added `getCalibrationPart2Seed()` — returns T1=20, T2=T1 taps, T3+=max of last two.
- Added `getCalibrationPart2FinalMTS()` — returns max(T2, T3) after 3 trials.
- Added `clearCalibrationPart2TapCounts()` — resets sequence on conditional retry.

**`src/modules/experiment/jspsych/calibration-trial.ts`**
- `autoIncreaseAmount()` — now calls `state.getCalibrationPart2Seed()` for Part2 types; Part1 still uses `medianTaps[CalibrationPart1]` (unchanged).
- `on_finish()` — calls `state.pushCalibrationPart2TapCount(data.tapCount)` after successful calibration for Part2 types.
- `handleSuccessfulCalibration()` — after the standard `updateMedianTaps`, overrides with `getCalibrationPart2FinalMTS()` once 3 trials are completed.
- `createConditionalCalibrationTrial()` stimulus — calls `state.clearCalibrationPart2TapCounts()` on retry for Part2 types.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files verified:
- FOUND: src/modules/experiment/utils/constants.ts (CALIBRATION_DEFAULT_SEED_TAPS=20)
- FOUND: src/modules/experiment/jspsych/experiment-state-class.ts (all 4 methods + interface field)
- FOUND: src/modules/experiment/jspsych/calibration-trial.ts (all 4 call sites)
- Commits: d7e59d8 (Task 1), 28a3119 (Task 2)
- TypeScript: only pre-existing cypress type error, no new errors
