---
phase: 09-calibration-adaptive-median
plan: 02
subsystem: ui
tags: [locales, stimulus, calibration, i18n, jsPsych]

# Dependency graph
requires:
  - phase: 09-calibration-adaptive-median
    provides: Calibration adaptive median logic and structure
provides:
  - Updated FR/EN locale keys for Calibration Part 2 directions (GSD Phase 9 wording)
  - Simplified calibrationPart2Stimuli layout without demonstration video
affects: [calibration, stimulus, locales]

# Tech tracking
tech-stack:
  added: []
  patterns: [i18n locale update, stimulus layout simplification]

key-files:
  created: []
  modified:
    - src/locales copy/fr/ns1.json
    - src/locales copy/en/ns1.json
    - src/modules/experiment/jspsych/stimulus.ts

key-decisions:
  - "Calibration Part 2 instruction screen uses text-only layout (no video) matching researcher-approved GSD Phase 9 wording"
  - "FR locale key CALIBRATION_PART_2_DIRECTIONS added with ol/li structure and {{TAP_KEY}} interpolation"
  - "EN locale key CALIBRATION_PART_2_DIRECTIONS replaced with English mirror of FR content"

patterns-established:
  - "Calibration stimulus functions use simple centered column layout without video elements"

requirements-completed: [REQ-015, REQ-037, REQ-038]

# Metrics
duration: 6min
completed: 2026-04-08
---

# Phase 09 Plan 02: Calibration Part 2 Instruction Text and Layout Update Summary

**Replaced Calibration Part 2 instruction screen with GSD Phase 9 researcher-approved text (remplir une barre) and removed the demonstration video, leaving a clean text-only layout.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-08T07:38:00Z
- **Completed:** 2026-04-08T07:44:17Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added FR locale key `CALIBRATION_PART_2_DIRECTIONS` with GSD Phase 9 wording including "remplir une barre" and ordered list structure
- Updated EN locale key `CALIBRATION_PART_2_DIRECTIONS` to English mirror with "filling a bar" and matching ol/li structure
- Removed video fieldset (calibration-part2.mp4) from `calibrationPart2Stimuli` and replaced side-by-side layout with clean centered column

## Task Commits

Each task was committed atomically:

1. **Task 1: Update FR and EN locale keys for CalibrationPart2 directions** - `8108152` (feat)
2. **Task 2: Update calibrationPart2Stimuli to remove video and use text-only layout** - `72e44bd` (feat)

## Files Created/Modified
- `src/locales copy/fr/ns1.json` - Added CALIBRATION_PART_2_DIRECTIONS with GSD Phase 9 FR wording
- `src/locales copy/en/ns1.json` - Replaced CALIBRATION_PART_2_DIRECTIONS with EN mirror content
- `src/modules/experiment/jspsych/stimulus.ts` - Removed video fieldset from calibrationPart2Stimuli, simplified to text-only centered column layout

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `src/locales copy/fr/ns1.json` — FOUND, contains "remplir une barre"
- `src/locales copy/en/ns1.json` — FOUND, contains "filling a bar"
- `src/modules/experiment/jspsych/stimulus.ts` — FOUND, no video element in calibrationPart2Stimuli
- Commit `8108152` — FOUND
- Commit `72e44bd` — FOUND
- TypeScript compiles without errors — CONFIRMED
