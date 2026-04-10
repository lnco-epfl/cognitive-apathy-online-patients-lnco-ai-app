# Quick Task 260408-jrh: implement phase 10 - target zone blue bar validation practice - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Task Boundary

Implement GSD Phase 10 (Slide 11): the blue-bar target-zone validation practice. Participants tap to bring the red bar into the blue zone and hold it there. 3 difficulty levels (Easy/Medium/Hard), with per-level retry logic and an extra validation fallback.

Relevant files:
- `src/modules/experiment/parts/validation.ts` — `buildValidation()` orchestrator
- `src/modules/experiment/jspsych/validation-trial.ts` — `createValidationTrial()`, `validationTrialExtra()`, `validationResultScreen()`, `handleValidationFinish()`
- `src/modules/experiment/jspsych/stimulus.ts` — `validationVideo()` instruction screen HTML
- `src/locales copy/fr/ns1.json` — FR locale strings
- `src/modules/experiment/utils/constants.ts` — `MAX_VALIDATION_FAILURES`, loop limits

</domain>

<decisions>
## Implementation Decisions

### Instruction screen heading
- Replace the current `CALIBRATION_HEADER()` heading in `validationVideo()` with a new locale key that renders "Entraînement 4".
- Update `validationVideo()` in `stimulus.ts` to use the new heading.

### Difficulty level structure
- Keep 3 sequential difficulty levels: Easy (5–23%), Medium (41–59%), Hard (77–95%). No change to bounds.
- Each level runs independently; failures on one level do not gate the others (unless extra validation is triggered — see below).

### Per-level retry logic
- Each level: 1 trial + max 2 retries = 3 total attempts before moving on.
- A "failure" = task completed without success AND no early key tap AND no keys released early (same failure definition as existing `handleValidationFinish`).
- Loop while `failures[level] < 2` AND last trial not successful. Stop after 3 failures OR 1 success.
- Replace the current global `validationTargetFailures` loop gate with per-level `failures[validationName]` counter.

### Extra validation trigger
- If a participant fails all 3 attempts at any difficulty level → set `extraValidationRequired = true`.
- Threshold: `failures[level] >= MAX_VALIDATION_ATTEMPTS_PER_LEVEL` (where `MAX_VALIDATION_ATTEMPTS_PER_LEVEL = 3`).
- Use the existing `extraValidationRequired` state flag; update `handleValidationFinish` threshold check to use this new constant.

### Extra validation block
- Runs `ValidationExtra` (same Hard bounds) up to 3 times.
- Exits on 1 success (continue) OR 3 failures (end experiment).
- NEW: on 3 failures → call `finishExperimentEarly(jsPsych, updateData)` instead of just adjusting the progress bar.
- `validationTrialExtra` is currently defined in `validation-trial.ts` but NOT wired into `buildValidation()`. Wire it now.

### End-of-validation result screen
- Currently only checks `validationTargetFailures >= MAX_VALIDATION_FAILURES`.
- Also end the experiment when `validationSuccess === false` (the flag set when extra validation is exhausted).

### Claude's Discretion
- `validationTargetFailures` global counter: retain it for potential analytics/data tracking, but it should no longer gate the retry loop. Can still increment it per failed trial but not used for loop control.
- `MAX_VALIDATION_FAILURES` constant: keep it defined but it is no longer the loop gate. If it becomes unused, mark it as a data-only constant.
- The median-taps adaptive reduction on hard failures (`validationHardFailures` logic in loop_function): preserve this behaviour unchanged.
- Instruction body text update (`VALIDATION_VIDEO_TUTORIAL_MESSAGE` FR key): update to GSD Phase 10 wording exactly.
- EN locale: update `VALIDATION_VIDEO_TUTORIAL_MESSAGE` in EN locale to an equivalent English translation.

</decisions>

<specifics>
## Specific Requirements

**GSD Phase 10 FR instruction text (verbatim):**
> En maintenant la touche S enfoncée, tapez la touche L de manière répétée pour :
> Amener et maintenir la barre rouge dans la zone cible bleue.
> Ne dépassez pas la zone cible bleu.
> **Restez à l'intérieur de la zone bleue !**

**New heading:** "Entraînement 4"

**Loop logic per level (pseudocode):**
```
loop: while (!lastTrialSuccess && failures[level] < MAX_VALIDATION_ATTEMPTS_PER_LEVEL)
trigger extra: when failures[level] >= MAX_VALIDATION_ATTEMPTS_PER_LEVEL
```

**Extra validation loop:**
```
loop: while (!lastTrialSuccess && extraFailures < MAX_EXTRA_VALIDATION_ATTEMPTS)
on exit: if extraFailures >= MAX_EXTRA_VALIDATION_ATTEMPTS → finishExperimentEarly()
```

**New constants to add:**
- `MAX_VALIDATION_ATTEMPTS_PER_LEVEL = 3`
- `MAX_EXTRA_VALIDATION_ATTEMPTS = 3`

</specifics>

<canonical_refs>
## Canonical References

- `docs/EBDM_Task_Instructions_GSD.md` Phase 10 section — full CURRENT STATE and IMPL notes
- `src/modules/experiment/jspsych/validation-trial.ts` — all 4 functions relevant to this task
- `src/modules/experiment/parts/validation.ts` — `buildValidation()` orchestrator
</canonical_refs>
