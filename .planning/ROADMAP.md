# Roadmap: EBDM Task — Experiment Flow Update

## Overview

Update the existing jsPsych-based EBDM experiment app to match the researcher-approved 22-phase instruction and flow design. Every phase in this roadmap corresponds to exactly one phase in `docs/EBDM_Task_Instructions_GSD.md`. Changes are brownfield — no new app scaffolding, only targeted edits to locale files, stimulus functions, trial builders, and calibration logic.

## Phases

- [ ] **Phase 1: Welcome Screen** - Update title and button text to GSD FR wording
- [ ] **Phase 2: Seating Instruction** - Update seating text to GSD FR wording
- [ ] **Phase 3: Task Overview** - Rewrite overview to game/offers/points framing
- [ ] **Phase 4: Dominant Hand Selection** - Reorder buttons to Droite first, Gauche second
- [ ] **Phase 5: S-Key Instruction Screen** - Add new static single-key instruction screen
- [ ] **Phase 6: Hold-S Practice Trial** - Build new HoldKeyPracticePlugin with loop logic
- [ ] **Phase 7: Dual-Key Instruction Screen** - Replace 5-page sequence with single screen
- [ ] **Phase 8: Dual-Key Practice Update** - Remove freeze-frame, set no thermometer, fix loop
- [ ] **Phase 9: Calibration — Adaptive Median** - Update instruction text + implement adaptive MTS logic
- [ ] **Phase 10: Blue-Bar Instruction Screen** - Replace video tutorial with static text+image screen
- [ ] **Phase 11: Post-Practice Questionnaire** - Update 4 items; fix "Left Arm" bug
- [ ] **Phase 12: Transition Screen** - Add standalone transition screen before task core
- [ ] **Phase 13: Game Instructions** - Rewrite 8-point instruction screen with offer image
- [ ] **Phase 14: Game Start Warning** - Add standalone warning screen with perturbation notice
- [ ] **Phase 15: Demo Trials** - Confirm structure; verify no offer screen precedes demo trials
- [ ] **Phase 16: Post-Demo Questionnaire** - Update 2-item questionnaire to exact GSD FR wording
- [ ] **Phase 17: Main Game Block** - Settings-only — confirm trial count is 32 in Graasp settings
- [ ] **Phase 18: Post-Block Questionnaire** - Update 6 items to exact GSD FR wording
- [ ] **Phase 19: Points Summary** - Update display text to GSD FR format
- [ ] **Phase 20: Instructions Summary Reposition** - Move summary screen to between-block position
- [ ] **Phase 21: Block Repeat Verification** - Verify loop covers phases 15–20 without code duplication
- [ ] **Phase 22: Final Calibration Update** - Remove Part 1; apply adaptive median to Part 2

## Phase Details

### Phase 1: Welcome Screen
**Goal**: The first screen participants see shows the correct French title and start button label.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-001, REQ-002, REQ-006
**Key files**:
- `src/locales copy/fr/ns1.json` — update `EXPERIMENT_BEGIN_MESSAGE` and `START_BUTTON_MESSAGE`
- `src/locales copy/en/ns1.json` — update EN equivalents
**Success Criteria** (what must be TRUE):
  1. Participant sees "Expérience d'effort et de prise de décision" as the screen title in FR
  2. The start button reads "Commencer" (not "Start" or "Démarrer") in FR
  3. EN locale mirrors the same content structure (title + button)
**Plans**: TBD

### Phase 2: Seating Instruction
**Goal**: The seating screen shows the updated FR instruction text with the existing tip.png image.
**Depends on**: Phase 1
**Requirements**: REQ-003, REQ-006
**Key files**:
- `src/locales copy/fr/ns1.json` — update `sitComfortablyStimuli` i18n key
- `src/locales copy/en/ns1.json` — update EN equivalent
- `src/modules/experiment/jspsych/stimulus.ts` — confirm tip.png reference unchanged
**Success Criteria** (what must be TRUE):
  1. Participant sees "Pendant toute l'expérience, veuillez vous asseoir confortablement avec votre visage à environ 50cm de votre écran."
  2. tip.png image still renders correctly alongside the text
  3. Continue button advances to Phase 3
**Plans**: TBD

### Phase 3: Task Overview
**Goal**: The overview screen introduces the experiment as a game with offers and points, not a measurement task.
**Depends on**: Phase 2
**Requirements**: REQ-004, REQ-006
**Key files**:
- `src/modules/experiment/jspsych/stimulus.ts` — rewrite `tutorialIntroductionStimuli()`
- `src/locales copy/fr/ns1.json` — update FR locale key
- `src/locales copy/en/ns1.json` — update EN locale key
**Success Criteria** (what must be TRUE):
  1. Screen uses game/offers/points framing ("petit jeu", "offres", "points", "bon d'achat") — no reference to "measurement" or "10 minutes practice"
  2. All 7 paragraphs from GSD Phase 3 FR text are present and in order
  3. EN locale mirrors the same conceptual framing (game, offers, reward)
**Plans**: TBD

### Phase 4: Dominant Hand Selection
**Goal**: The hand selection screen lists "Droite" first and "Gauche" second, and stores the result correctly.
**Depends on**: Phase 3
**Requirements**: REQ-005, REQ-006, REQ-039
**Key files**:
- `src/modules/experiment/parts/introduction.ts` — reorder buttons in `askPreferredHand()`, invert `on_finish` response index
- `src/locales copy/fr/ns1.json` — update `DOMINANT_HAND_MESSAGE` to "Sélectionnez votre main dominante."
- `src/locales copy/en/ns1.json` — update EN equivalent
**Success Criteria** (what must be TRUE):
  1. "Droite" button appears first (index 0), "Gauche" button appears second (index 1)
  2. Selecting "Droite" stores `'right'` in state; selecting "Gauche" stores `'left'`
  3. All subsequent instruction screens that reference hands reflect the stored selection correctly
**Plans**: TBD

### Phase 5: S-Key Instruction Screen
**Goal**: A new static screen introduces the S key and left-hand hold before any active practice begins.
**Depends on**: Phase 4
**Requirements**: REQ-007, REQ-037, REQ-038, REQ-039
**Key files**:
- `src/modules/experiment/parts/practice.ts` — add new static instruction trial at start of `buildPracticeTrials()`
- `src/modules/experiment/jspsych/stimulus.ts` — add `sKeyInstructionStimuli()` function
- `src/locales copy/fr/ns1.json` — add FR locale keys for Phase 5 content
- `src/locales copy/en/ns1.json` — add EN locale keys
**Success Criteria** (what must be TRUE):
  1. Screen appears as the first screen in the practice sequence, before any active trial
  2. Hand image shown is `hand-l-1.png` when left-handed is selected, `hand-r-1.png` when right-handed
  3. Text correctly names the non-dominant hand for holding S (dynamic, not hardcoded "main Gauche")
**Plans**: TBD
**UI hint**: yes

### Phase 6: Hold-S Practice Trial
**Goal**: Participants actively practice holding the S key for ~5 seconds, with success/retry feedback and a capped loop.
**Depends on**: Phase 5
**Requirements**: REQ-008, REQ-009, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/trials/hold-key-practice-trial.ts` — NEW file: `HoldKeyPracticePlugin` class
- `src/modules/experiment/parts/practice.ts` — add `holdKeyPracticeBlock()` factory with loop_function
- `src/modules/experiment/utils/constants.ts` — add `HOLD_KEY_PRACTICE_DURATION`, `HOLD_KEY_MIN_SUCCESSES`, `HOLD_KEY_MAX_FAILURES`
- `src/locales copy/fr/ns1.json` — add FR strings: prompt, release, success, retry messages
- `src/locales copy/en/ns1.json` — add EN strings
**Success Criteria** (what must be TRUE):
  1. Holding S for ~5 seconds then releasing shows "Très bien !" + checkmark; releasing early shows the retry message and loops
  2. The loop exits after 2 successful completions OR after 3 failures, whichever comes first
  3. "Entraînement réussi" screen with Continue button appears at the end of the loop
**Plans:** 2 plans
Plans:
- [ ] 06-01-PLAN.md — Constants, locale keys, and HoldKeyPracticePlugin class
- [ ] 06-02-PLAN.md — Integration into practice.ts with loop logic and browser verification

### Phase 7: Dual-Key Instruction Screen
**Goal**: A single screen replaces the 5-page tapping instruction sequence, showing both S and L key instructions with a dual-hand image.
**Depends on**: Phase 6
**Requirements**: REQ-010, REQ-037, REQ-038, REQ-039
**Key files**:
- `src/modules/experiment/jspsych/stimulus.ts` — replace pages 2–5 of `tappingInstructionPagesStimulus()` with single-page function
- `src/locales copy/fr/ns1.json` — update FR locale keys for Phase 7 content
- `src/locales copy/en/ns1.json` — update EN locale keys
**Success Criteria** (what must be TRUE):
  1. Exactly one instruction screen covers dual-key instructions (no multi-page sequence)
  2. `hand-l-3.png` is shown for left-hand-dominant participants, `hand-r-3.png` for right-hand-dominant
  3. Text matches GSD Phase 7 FR wording including the "Attention:" block and GO signal reference
**Plans**: TBD
**UI hint**: yes

### Phase 8: Dual-Key Practice Update
**Goal**: The dual-key practice runs without a thermometer bar and without freeze-frame coaching; exits after 2 successes or 3 failures.
**Depends on**: Phase 7
**Requirements**: REQ-011, REQ-012, REQ-013, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/parts/practice.ts` — remove freeze-frame sequence, set `showThermometer: false`, update loop exit condition to 2 successes / 3 failures
- `src/modules/experiment/utils/constants.ts` — confirm/update `MAX_PRACTICE_LOOP_RETRIES`
- `src/locales copy/fr/ns1.json` — update or add "Entraînement réussi" screen content
- `src/locales copy/en/ns1.json` — update EN equivalent
**Success Criteria** (what must be TRUE):
  1. No thermometer bar is visible during dual-key practice trials
  2. No freeze-frame coaching overlay appears after a trial
  3. "Entraînement réussi" screen appears after loop exits (at 2 successes or 3 failures)
**Plans**: TBD

### Phase 9: Calibration — Adaptive Median
**Goal**: Calibration uses adaptive per-trial seeding (T1=default 20, T2=T1, T3=max(T1,T2), final=max(T2,T3)) and shows updated FR instruction text.
**Depends on**: Phase 8
**Requirements**: REQ-014, REQ-015, REQ-016, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/jspsych/experiment-state-class.ts` — add `calibrationTrialTapCounts` state, `pushCalibrationTapCount`, `getCalibrationSeed`, `clearCalibrationTapCounts` methods
- `src/modules/experiment/jspsych/calibration-trial.ts` — update `handleSuccessfulCalibration`, update `autoIncreaseAmount` lookup, add `on_timeline_finish` final MTS computation
- `src/modules/experiment/utils/constants.ts` — add `CALIBRATION_DEFAULT_SEED_TAPS = 20`
- `src/modules/experiment/jspsych/stimulus.ts` — update calibration instruction stimulus text
- `src/locales copy/fr/ns1.json` — update FR calibration instruction text to GSD Phase 9 wording
- `src/locales copy/en/ns1.json` — update EN equivalent
**Success Criteria** (what must be TRUE):
  1. Trial 1 bar scaling uses a seed of 20 taps; Trial 2 uses Trial 1's actual tap count; Trial 3 uses max(T1, T2)
  2. The final stored MTS value after calibration equals max(T2 taps, T3 taps)
  3. Calibration instruction text matches GSD Phase 9 FR wording ("remplir une barre", "le plus rapidement possible")
**Plans**: TBD

### Phase 10: Blue-Bar Instruction Screen
**Goal**: The video tutorial is removed and replaced by a static text + image screen describing the blue target zone.
**Depends on**: Phase 9
**Requirements**: REQ-017, REQ-018, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/parts/validation.ts` — remove video trial, insert new static instruction trial
- `src/modules/experiment/jspsych/stimulus.ts` — add `blueBarInstructionStimuli()` function
- `src/locales copy/fr/ns1.json` — add FR locale keys for Phase 10 content
- `src/locales copy/en/ns1.json` — add EN locale keys
**Success Criteria** (what must be TRUE):
  1. No video plays in the validation section — it is replaced by a static screen
  2. Screen text describes: hold S, tap L, get bar into blue zone, stay inside ("Restez à l'intérieur de la zone bleue!")
  3. An image illustrating the blue target zone is displayed on the screen
**Plans**: TBD
**UI hint**: yes

### Phase 11: Post-Practice Questionnaire
**Goal**: The post-practice questionnaire has exactly 4 updated 7-point Likert items with "vos doigts" replacing the hardcoded "Left Arm".
**Depends on**: Phase 10
**Requirements**: REQ-019, REQ-020, REQ-021, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/trials/likert-trial.ts` — update `likertFinalQuestionAfterValidation()` items; fix item 3; accept `state` parameter if needed
- `src/locales copy/fr/ns1.json` — update 4 FR Likert item strings
- `src/locales copy/en/ns1.json` — update 4 EN Likert item strings
- `src/modules/experiment/parts/validation.ts` — update call site if `state` parameter is added
**Success Criteria** (what must be TRUE):
  1. Questionnaire shows exactly 4 items: attention, motivation, finger fatigue, general fatigue — in that order
  2. Item 3 reads "de vos doigts" (not "Left Arm" or any arm reference)
  3. All 4 items use a 7-point scale from "Très faible" to "Très élevé"
**Plans**: TBD

### Phase 12: Transition Screen
**Goal**: A dedicated transition screen appears between validation and task core, telling participants they are entering the next game phase.
**Depends on**: Phase 11
**Requirements**: REQ-022, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/parts/validation.ts` — add new static trial after `validationResultScreen()`
- `src/modules/experiment/jspsych/stimulus.ts` — add `transitionToGameStimuli()` function
- `src/locales copy/fr/ns1.json` — add FR locale key for Phase 12 content
- `src/locales copy/en/ns1.json` — add EN locale key
**Success Criteria** (what must be TRUE):
  1. After passing validation, participant sees "Vous allez maintenant entrer dans la prochaine phase du jeu." before any task trial appears
  2. Screen has a Continue button that advances to `buildTaskCore()`
  3. The transition screen does not appear on failed validation (only on pass path)
**Plans**: TBD

### Phase 13: Game Instructions
**Goal**: The game instruction screen shows the full 8-point numbered list with arrow key labels and the two-offer diagram image.
**Depends on**: Phase 12
**Requirements**: REQ-023, REQ-024, REQ-037, REQ-038, REQ-039
**Key files**:
- `src/modules/experiment/parts/task-core.ts` — add or update pre-task instruction trial
- `src/modules/experiment/jspsych/stimulus.ts` — add `gameInstructionStimuli()` function
- `src/locales copy/fr/ns1.json` — add FR locale keys for 8-point list content
- `src/locales copy/en/ns1.json` — add EN locale keys
**Success Criteria** (what must be TRUE):
  1. Screen shows all 8 numbered instruction points matching GSD Phase 13 FR text
  2. `two-offer-view.png` image is displayed on the screen
  3. Arrow key labels ("refuser" / "accepter") are visible on-screen
**Plans**: TBD
**UI hint**: yes

### Phase 14: Game Start Warning
**Goal**: A standalone warning screen appears immediately before the first demo trial, including the perturbation notice.
**Depends on**: Phase 13
**Requirements**: REQ-025, REQ-026, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/parts/task-core.ts` — add new static warning trial before demo block
- `src/modules/experiment/jspsych/stimulus.ts` — add `gameStartWarningStimuli()` function
- `src/locales copy/fr/ns1.json` — add FR locale keys including perturbation warning text
- `src/locales copy/en/ns1.json` — add EN locale keys
**Success Criteria** (what must be TRUE):
  1. A screen appears before the first demo trial reading "Le jeu va maintenant commencer. Tenez-vous prêt-e."
  2. The perturbation warning ("parfois, vous aurez l'impression que la barre bouge différemment") is present verbatim
  3. Screen has a Continue button; no trial starts until participant clicks it
**Plans**: TBD

### Phase 15: Demo Trials
**Goal**: Demo trials use the existing `generateTaskTrial()` structure without a preceding offer screen or thermometer setup.
**Depends on**: Phase 14
**Requirements**: REQ-027
**Key files**:
- `src/modules/experiment/jspsych/trials.ts` — verify demo trial generation does not include offer/thermometer preamble
- `src/modules/experiment/parts/task-core.ts` — confirm demo block is correctly wired after Phase 14 warning
**Success Criteria** (what must be TRUE):
  1. Demo trials present the tapping task directly without an offer selection screen preceding them
  2. Demo trial count is driven by settings (configurable, not hardcoded)
  3. Demo trials use the same accept/reject + effort mechanics as main game trials
**Plans**: TBD

### Phase 16: Post-Demo Questionnaire
**Goal**: The 2-item post-demo questionnaire shows exact GSD FR wording on a 7-point Likert scale.
**Depends on**: Phase 15
**Requirements**: REQ-028, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/trials/likert-trial.ts` — update `likertQuestions1()` item text
- `src/locales copy/fr/ns1.json` — update FR locale keys for 2 items
- `src/locales copy/en/ns1.json` — update EN locale keys
**Success Criteria** (what must be TRUE):
  1. Item 1 reads "J'avais l'impression de contrôler le mouvement de la barre."
  2. Item 2 reads "J'ai trouvé le jeu difficile."
  3. Both items use a 7-point Likert scale
**Plans**: TBD

### Phase 17: Main Game Block
**Goal**: Confirm the 32-trial main game block is correctly configured via Graasp settings with no code changes required.
**Depends on**: Phase 16
**Requirements**: REQ-027
**Key files**:
- Graasp app settings (not a code change) — verify `taskPermutationRepetitions × taskBoundsIncluded × taskRewardsIncluded` yields 32 trials
- `src/modules/experiment/jspsych/trials.ts` — read-only verification that `createTaskBlockTrials()` structure is correct
**Success Criteria** (what must be TRUE):
  1. Main game block runs 32 trials (confirmed via settings, not hardcoded)
  2. Trial structure (offer → tapping → release → feedback → loading bar) runs correctly for all 32 trials
  3. No code changes were needed; settings-only configuration is documented
**Plans**: TBD

### Phase 18: Post-Block Questionnaire
**Goal**: The 6-item post-block questionnaire shows exact GSD FR wording on a 7-point Likert scale, with randomization verified.
**Depends on**: Phase 17
**Requirements**: REQ-029, REQ-030, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/trials/likert-trial.ts` — update `likertQuestions2Randomized()` item text
- `src/locales copy/fr/ns1.json` — update FR locale keys for 6 items
- `src/locales copy/en/ns1.json` — update EN locale keys
**Success Criteria** (what must be TRUE):
  1. All 6 items match GSD Phase 18 FR wording exactly (attention, difficulty, indifference, efficiency, satisfaction, encouragement)
  2. Items use a 7-point Likert scale
  3. Randomization behavior is confirmed with researcher and either retained or disabled accordingly
**Plans**: TBD

### Phase 19: Points Summary
**Goal**: The points summary screen displays cumulative points in the GSD FR format without money conversion.
**Depends on**: Phase 18
**Requirements**: REQ-031, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/jspsych/trials.ts` — update `createRewardDisplayTrial()` display text
- `src/locales copy/fr/ns1.json` — update FR locale key for reward display
- `src/locales copy/en/ns1.json` — update EN locale key
**Success Criteria** (what must be TRUE):
  1. Screen reads "Vous avez obtenu : [X] points au total." with the actual point count substituted
  2. Money/EUR conversion is not displayed on this screen
  3. Continue button text matches GSD Phase 19 ("Appuyez sur le bouton ci-dessous pour continuer vers les prochaines séries")
**Plans**: TBD

### Phase 20: Instructions Summary Reposition
**Goal**: The "Résumé des instructions" screen is repositioned to appear after the points summary and before the next block's demo trial.
**Depends on**: Phase 19
**Requirements**: REQ-032, REQ-033, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/jspsych/trials.ts` — move `rememberEffortRewardTrialDirection()` from start of offer trials to after reward display
- `src/modules/experiment/jspsych/stimulus.ts` — update `rememberDirectionContent()` with GSD "Résumé des instructions" text
- `src/locales copy/fr/ns1.json` — update FR locale keys
- `src/locales copy/en/ns1.json` — update EN locale keys
**Success Criteria** (what must be TRUE):
  1. Instructions summary appears after the reward display and before the next block's demo — not at the start of the offer block
  2. Screen title reads "Résumé des instructions" and shows the 4-point summary matching GSD Phase 20
  3. `two-offer-view.png` image is included on this screen
**Plans**: TBD
**UI hint**: yes

### Phase 21: Block Repeat Verification
**Goal**: Verify that the block loop (Phases 15–20) repeats correctly N times without duplicated code.
**Depends on**: Phase 20
**Requirements**: REQ-027
**Key files**:
- `src/modules/experiment/parts/task-core.ts` — read-only verification of loop structure
- `src/modules/experiment/jspsych/trials.ts` — read-only verification that `generateTaskTrialBlock()` covers the full Phase 15–20 sequence
**Success Criteria** (what must be TRUE):
  1. The full Phase 15–20 sequence (demo → post-demo Q → trials → post-block Q → reward → instructions summary) executes inside a loop, not duplicated code
  2. Block count is driven by `taskBlockRepetitions × taskBlocksIncluded.length` from settings
  3. No Phase 15–20 content is hardcoded to a specific block index
**Plans**: TBD

### Phase 22: Final Calibration Update
**Goal**: Final calibration removes Part 1 entirely and applies the same adaptive median logic as Phase 9 to Part 2.
**Depends on**: Phase 21
**Requirements**: REQ-034, REQ-035, REQ-036, REQ-037, REQ-038
**Key files**:
- `src/modules/experiment/parts/calibration.ts` — remove Part 1 trials and instruction from `buildFinalCalibration()`
- `src/modules/experiment/jspsych/calibration-trial.ts` — remove `FinalCalibrationPart1` special-case from `autoIncreaseAmount`; confirm `on_timeline_finish` MTS logic applies to `FinalCalibrationPart2`
- `src/modules/experiment/jspsych/stimulus.ts` — update `finalCalibrationPart2Stimuli` to "Test de fin" wording; mark `finalCalibrationPart1Stimuli` as dead code
- `src/modules/experiment/utils/constants.ts` — remove or mark `NUM_FINAL_CALIBRATION_TRIALS_PART_1` as unused
- `src/locales copy/fr/ns1.json` — update FR locale key for final calibration instruction
- `src/locales copy/en/ns1.json` — update EN locale key
**Success Criteria** (what must be TRUE):
  1. No no-bar warmup trials run during final calibration — the session goes directly to the with-bar "Test de fin" trials
  2. Final calibration Part 2 bar scaling uses the same adaptive seed logic as main calibration (T1=20, T2=T1 taps, T3=max(T1,T2), final=max(T2,T3))
  3. Instruction text reads "Test de fin" and matches GSD Phase 22 FR wording
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Welcome Screen | 0/? | Not started | - |
| 2. Seating Instruction | 0/? | Not started | - |
| 3. Task Overview | 0/? | Not started | - |
| 4. Dominant Hand Selection | 0/? | Not started | - |
| 5. S-Key Instruction Screen | 0/? | Not started | - |
| 6. Hold-S Practice Trial | 0/2 | Planned | - |
| 7. Dual-Key Instruction Screen | 0/? | Not started | - |
| 8. Dual-Key Practice Update | 0/? | Not started | - |
| 9. Calibration — Adaptive Median | 0/? | Not started | - |
| 10. Blue-Bar Instruction Screen | 0/? | Not started | - |
| 11. Post-Practice Questionnaire | 0/? | Not started | - |
| 12. Transition Screen | 0/? | Not started | - |
| 13. Game Instructions | 0/? | Not started | - |
| 14. Game Start Warning | 0/? | Not started | - |
| 15. Demo Trials | 0/? | Not started | - |
| 16. Post-Demo Questionnaire | 0/? | Not started | - |
| 17. Main Game Block | 0/? | Not started | - |
| 18. Post-Block Questionnaire | 0/? | Not started | - |
| 19. Points Summary | 0/? | Not started | - |
| 20. Instructions Summary Reposition | 0/? | Not started | - |
| 21. Block Repeat Verification | 0/? | Not started | - |
| 22. Final Calibration Update | 0/? | Not started | - |
