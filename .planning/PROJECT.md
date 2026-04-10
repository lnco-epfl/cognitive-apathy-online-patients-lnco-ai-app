# EBDM Task — Experiment Flow Update

## What We're Building

Updating an existing jsPsych-based effort-based decision-making (EBDM) experiment app for Parkinson's disease patients to match a new, researcher-approved instruction and flow design. This is a **brownfield update** — no new app scaffolding, only changes to existing code.

The app runs on the LNCO.ai platform (Graasp fork). Participants complete the task remotely from home, primarily in French.

## Spec Document

All 22 phases are defined in `docs/EBDM_Task_Instructions_GSD.md`, including:
- GSD phase descriptions (participant-facing content)
- `[CURRENT STATE]` annotations (what exists in code today)
- `[IMPL]` annotations (what needs to change, which files)
- Researcher-answered open questions (at bottom of doc)

## Key Decisions (Researcher-Confirmed)

- **Keys:** S always on left hand, L always on right hand. Hand preference only changes which hand *taps* vs *holds*.
- **Calibration median:** Trial 1 → default 20 taps. Trial 2 → uses Trial 1 taps. Trial 3 → uses max(T1, T2). Final median = max(T2, T3).
- **Practice loops:** Continue after 2 successes OR 3 failures (both Phase 6 single-key and Phase 8 dual-key).
- **Blue zone:** Fixed `BOUNDS_DEFINITIONS` (not calibration-derived).
- **Questionnaires:** All 7-point Likert.
- **Demo trials:** Same `generateTaskTrial()` structure, no preceding offer/thermometer.
- **Agency manipulation:** Already implemented via `DelayType.WideAsync` (0–1000ms delay).
- **Final calibration:** Part 1 (no-bar warmup) removed entirely; Part 2 follows new calibration median logic.
- **Image assets:** Exist in `public/assets/images/` — `hand-l-1.png`, `hand-l-3.png`, `hand-r-1.png`, `hand-r-3.png`, `two-offer-view.png`.

## Codebase Entry Points

| File | Role |
|------|------|
| `src/modules/experiment/experiment.ts` | Top-level timeline assembler |
| `src/modules/experiment/parts/introduction.ts` | Phases 1–4 |
| `src/modules/experiment/parts/practice.ts` | Phases 5–8 |
| `src/modules/experiment/parts/calibration.ts` | Phases 9, 22 |
| `src/modules/experiment/parts/validation.ts` | Phases 10–12 |
| `src/modules/experiment/parts/task-core.ts` | Phases 13–21 |
| `src/modules/experiment/jspsych/stimulus.ts` | All HTML stimulus content |
| `src/modules/experiment/utils/constants.ts` | Timing, count, and numeric constants |
| `src/modules/experiment/trials/likert-trial.ts` | All questionnaire trials |
| `src/modules/experiment/jspsych/trials.ts` | Task block generation (demo, trials, reward) |
| `src/locales copy/fr/ns1.json` | French translations (experiment content) |
| `src/locales copy/en/ns1.json` | English translations (experiment content) |

## Participant Population

Parkinson's disease patients, remote, primarily French-speaking. Accessibility constraints:
- Large buttons, plain language, short sentences
- Audio instructions via TTS (Web Speech API, `jspsych/speech.ts`)
- Minimal cognitive load per screen

## What Is NOT Changing

- React shell, Graasp integration, data saving, settings system
- Agency manipulation logic (`DelayType.WideAsync`)
- ADO math, trial block generation structure
- Serial port trigger system
- Progress bar system
