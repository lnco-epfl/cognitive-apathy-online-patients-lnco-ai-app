# EBDM Task — GSD Implementation Guide

## Header: Project Context

**What this is:** A GSD (Goal-Directed Specification) document for updating the Emotion-Based Decision-Making (EBDM) task in the existing LNCO.ai experiment app. Claude Code should **update existing code**, not create from scratch.

**Codebase:** React + TypeScript, jsPsych-based, running on the LNCO.ai/Graasp platform. See `APP_SUMMARY.json` for full architecture. The experiment flow is managed via phase builders in `src/modules/experiment/parts/`.

**Participant population:** Parkinson's disease patients completing the task remotely from home. Key UI constraints:

- Large, clearly labelled buttons
- Plain language (active voice, short sentences)
- Audio instructions preferred (pre-recorded via ElevenLabs)
- Minimal cognitive load per screen
- Pause/resume functionality where possible

**Language:** French (primary). All instruction text below is in French as it appears in the source slides.

**Task summary:** An effort-based decision-making task. Participants hold the **S key** with their left hand and tap the **L key** repeatedly with their right hand to fill a bar. They receive offers of varying point values requiring varying effort levels, and decide whether to accept or reject each offer. Points convert to a reward (gift voucher) at the end.

**Key interactions:**

- Keyboard: S (hold, left hand), L (tap repeatedly, right hand), arrow keys (accept/reject offers)
- Mouse: "Continuer" button to advance between phases
- Dominant hand selection at start (determines which hand holds S vs. taps L)

**Implementation note — dominant hand:** Slide 4 asks the participant to select their dominant hand (Right / Left). The instructions throughout assume **Left** hand holds S and **Right** hand taps L. If right-handed dominance is selected, this mapping may invert — clarify with researcher before implementing.

---

> **GSD workflow:** Each H2 section below = one GSD phase. Implement and test each phase before moving to the next. Annotated notes for Claude Code are marked **[DEV NOTE]**.

---

## Phase 1 — Welcome Screen

**Slide:** 1

**Content:**

> Expérience d'effort et de prise de décision

> Appuyez sur le bouton ci-dessous pour commencer

> Continuer

**UI:** Full-screen title. Welcome message. Continue button

**[DEV NOTE]:** This is a static welcome screen. Check what currently renders as the first screen in `buildIntroduction()`. Update title text if needed. No interaction required beyond a Continue button.

**[CURRENT STATE]:** `experimentBeginTrial()` in `parts/introduction.ts` uses `FullscreenPlugin`. Title text comes from `EXPERIMENT_BEGIN_MESSAGE()` i18n key; button from `START_BUTTON_MESSAGE()`. Fullscreen triggers on click.

**[IMPL]:** Update `EXPERIMENT_BEGIN_MESSAGE()` value in `src/locales copy/fr/ns1.json` to "Expérience d'effort et de prise de décision". Update button text (`START_BUTTON_MESSAGE`) to "Commencer". The FullscreenPlugin can stay — its `message` maps to the title/body and `button_label` to the button. Minimal change.

---

## Phase 2 — Seating Instruction

**Slide:** 2

**Content:**

> Pendant toute l'expérience, veuillez vous asseoir confortablement avec votre visage à environ 50cm de votre écran.

**UI:** Single instruction with image (person seated at screen (called tip.png, same image as used currently for this screen)). Continue button.

**[DEV NOTE]:** Static instruction screen. Part of introduction sequence.

**[CURRENT STATE]:** `sitComfortably()` in `parts/introduction.ts` renders `sitComfortablyStimuli()` from `jspsych/stimulus.ts`. Already uses `tip.png` image.

**[IMPL]:** Text-only update. Update `sitComfortablyStimuli()` i18n key in FR locale to "Pendant toute l'expérience, veuillez vous asseoir confortablement avec votre visage à environ 50cm de votre écran." Confirm `tip.png` is the same image referenced in the slide.

---

## Phase 3 — Task Overview

**Slide:** 3

**Content:**

> Expérience d’effort et de prise de décision
>
> Dans cette tâche, vous allez participer à un petit jeu.
>
> On va vous proposer des offres qui vous permettront d'obtenir et de cumuler des points. Chaque offre indiquera combien de points vous pouvez gagner.
>
> Vous devrez décider si vous acceptez ou refusez chaque offre.
>
> Les offres avec peu de points nécessitent peu d'effort, tandis que celles avec plus de points demandent davantage d'effort.
>
> À la fin du jeu, les points accumulés seront convertis en récompense (bon d'achat).
>
> Nous vous guiderons à chaque étape et vous aurez l'occasion de vous entraîner. Veuillez suivre attentivement les instructions de chaque étape.
>
> Cliquez sur le bouton ci-dessous pour continuer.

**UI:** Multi-paragraph instruction screen with Continue button.

**[DEV NOTE]:** Static instruction screen. Part of introduction sequence.

**[CURRENT STATE]:** `tutorialIntroductionTrial()` in `parts/introduction.ts` uses `tutorialIntroductionStimuli()` from `jspsych/stimulus.ts`. Currently describes the experiment as a 10-min practice + 30-min tapping task — framed as a measurement task, not a "game with offers".

**[IMPL]:** **Major text rewrite.** Replace `tutorialIntroductionStimuli()` content with the GSD Phase 3 text: game framing, offers/points concept, effort↔reward relationship, and reward conversion to gift voucher. Update FR and EN locale keys accordingly.

---

## Phase 4 — Dominant Hand Selection

**Slide:** 4

**Content:**

> Sélectionnez votre main dominante.
>
> - Droite
> - Gauche

**UI:** Two large buttons (or radio buttons), one for Right, one for Left. Selection should be stored and used to determine key-hand mapping throughout the task.

**[DEV NOTE]:** This likely already exists in some form, it is a simplification of what we currently have. Confirm that the selected dominant hand is stored in experiment state and that all subsequent instruction text and key assignments reference it dynamically. If not already implemented, this is a required addition before instructions referencing "main Gauche / main Droite" can be correct.

**[CURRENT STATE]:** `askPreferredHand(state)` in `parts/introduction.ts` fully exists. Button order is `LEFT_HAND_BUTTON()` (index 0 → stores `'left'`) then `RIGHT_HAND_BUTTON()` (index 1 → stores `'right'`). Result stored via `state.setPreferredHand()` and propagates to all key assignments.

**[IMPL]:** **Button order change required.** GSD lists "Droite" first, "Gauche" second — currently LEFT is first. Reorder choices to `[RIGHT_HAND_BUTTON(), LEFT_HAND_BUTTON()]` and invert `on_finish` logic to `data.response === 0 ? 'right' : 'left'`. Update `DOMINANT_HAND_MESSAGE` FR text to "Sélectionnez votre main dominante."

---

## Phase 5 — Instructions 1: Holding the S Key

**Slide:** 6 *(Slide 5 is a researcher-facing skip screen — not shown to participants)*

**Content:**

> Instructions 1
>
> Pour le moment ne faites rien.
> Lisez et écoutez attentivement les instructions suivantes pour utiliser les touches du clavier et vous entraîner.
>
> Avec l'index ou le majeur de la main Gauche, vous allez maintenir la touche S du clavier enfoncée jusqu'à ce qu'on vous demande d'arrêter.
>
> Cliquez sur «Continuer» pour passer à l'entraînement 1.

**UI:** Instruction text + image of keyboard highlighting the S key (colour-coded — blue suggested in slide notes, choose a colour-blind-safe colour). Only left hand shown in image. You can use "hand-l-1.png or hand-r-1.png with l referring to left selected in the question before and r referring to right hand as selected before. Note that these instructions above should refer to the non-dominant hand.

**[DEV NOTE]:** Slide notes say "Use colour code to link left finger with S", "Change to FR", "Show only left hand". The keyboard image should highlight S key in a colour-blind-safe colour (for this we will use blue). No active task here — participant reads/listens only.

**[CURRENT STATE]:** **Does not exist as a standalone screen.** `buildPracticeTrials()` in `parts/practice.ts` starts with `tappingInstructionsTimeline(state)` — a 5-page sequence that covers dual-key instructions from the start. There is no single-key-only instruction screen.

**[IMPL]:** **New screen required.** Add a new static instruction trial at the start of `buildPracticeTrials()`. Content: GSD Phase 5 text with keyboard image highlighting S key in blue. Image selection (`hand-l-1.png` / `hand-r-1.png`) based on `state.getPreferredHand()`. Confirm these assets exist in `public/assets/` or need to be added.

---

## Phase 6 — Practice 1: Hold S Key

**Slide:** 7

**Content:**

> À vous d'essayer !
>
> Avec l'index ou le majeur de la main Gauche, maintenez la touche S du clavier jusqu'à ce qu'on vous demande d'arrêter.
>
> Allez-y !

**Flow:**

1. Participant holds S key
2. After sufficient hold time → **"Relâchez la touche"**
3. After releasing → **"Très bien !"** + checkmark
4. If S released too early → display: **"Maintenez la touche S enfoncée"** → loop back, repeat practice at step 1
5. Repeat practice a second time at step 1 -> **"Répéter l’entraînement"**
6. After loop → "Entraînement réussi" -> Continue button appears: "Maintenant cliquez sur «Continuer» pour passer à l'étape suivante"

**[DEV NOTE]:** This is an active keyboard practice trial. Uses existing key-hold detection logic. "Release keys" message should be displayed after 5 seconds. On success, show checkmark and Continue. On failure, show reminder message and retry — no limit on retries implied.

**[CURRENT STATE]:** **Does not exist.** The current practice goes directly from the 5-page instruction sequence to the full dual-key tapping trial. There is no single-key (S-only) hold practice anywhere in the codebase.

**[IMPL]:** **New trial type required.** Build a `holdKeyPracticeTrial` (new function in `parts/practice.ts`) that: (1) shows "Allez-y! Maintenez la touche S enfoncée" prompt, (2) detects hold key using existing `keysToHold` logic, (3) after ~5 seconds continuous hold shows "Relâchez la touche" and waits for release, (4) on success shows "Très bien !" + checkmark, (5) on early release retries with message to keep the button pressed, (6) loops ×2 minimum then shows "Entraînement réussi" + Continue. Insert between Phase 5 instruction and Phase 7 instruction.

## Phase 7 — Instructions 2: Tapping L While Holding S

**Slide:** 8

**Content:**

> Pour le moment ne faites rien.
> Lisez et écoutez attentivement les instructions suivantes pour effectuer cette exercice de frappes.
>
> Tout en maintenant l'index ou le majeur de la main Gauche enfoncée sur la touche S, avec l'index ou le majeur de la main Droite, tapez sur la touche L du clavier de manière continue dès que vous voyez le message «GO».
>
> **Maintenez la touche S enfoncée** > **Tapez la touche L en continu**
>
> **Attention :**
> Attendez le signal «GO» avant de taper sur la touche L de manière répétée.
> Utilisez uniquement l'index ou le majeur de la main Droite pour taper sur la touche L sans relâcher la touche S du doigt Gauche.
> Ne changez pas de doigts.
>
> Cliquez sur «Continuer» pour effectuer l'entraînement 2.

**UI:** Keyboard image showing both S (left, held) and L (right, tapping). Colour coding for both keys.

**[DEV NOTE]:** Static instruction screen with audio. The image should show both hands / both keys highlighted. No active task yet.

**[CURRENT STATE]:** Pages 2–5 of `tappingInstructionPagesStimulus(state)` in `jspsych/stimulus.ts` cover step-by-step dual-key instructions, spread across 4 screens. No dual-key keyboard image currently exists in these pages.

**[IMPL]:** **Text + structure update.** After adding the Phase 6 single-key practice block, the remaining instruction pages 2–5 of `tappingInstructionPagesStimulus` should be replaced with a single screen matching GSD Phase 7 content. Keyboard image asset with both S (blue) and L (second colour) highlighted needs to be confirmed/added in `public/assets/`.

---

## Phase 8 — Practice 2: Hold S + Tap L on GO

**Slide:** 9

**Flow:**

1. **"Allez-y ! Maintenez la touche S enfoncée tout au long"** → participant presses and holds S
2. Start the countdown as in the normal countdown trial.
3. **"GO! Tapez la touche L de manière répétée"** → participant taps L continuously (no countdown visible)
4. End of tapping window → **"Relâchez toutes les touches"** → checkmark
5. If participant stops tapping before the end (for more than 500ms let's say) → **"Continuez à taper"** reminder
6. If they fail, give an error message accordingly, reasons for failing are: Tapping before Go, Tapping too little at the end (let's say <15, unless there's an existing setting for this) or releasing the Hold key too early. In this case this counts as a failure.
7. **Loop ×2** (2 repetitions total)
8. After loop, either 2 successes or 3 failures. → **"Entraînement réussi"**

**[DEV NOTE]:** This practice has no bar or score visible — just the dual-key coordination. No countdown timer shown to participant. "Continue tapping" reminder if tapping stops. Confirm loop count (×2) with researcher.

**[CURRENT STATE]:** The dual-key practice currently runs through `practiceLoop()` in `parts/practice.ts` (used in `buildPracticeTrials()`). Each loop iteration is: `interactiveCountdown()` → `practiceTrial()` (thermometer hidden) → `successScreenFreezeFrame()` → loading bar. The countdown is implemented by `CountdownTrialPlugin` (`countdown-trial.ts`) and displays a visible timer (`COUNTDOWN_TIMER_MESSAGE`), which conflicts with Phase 8's "no countdown visible" requirement. The tapping trial already has no bar (`showThermometer: false` in `practiceTrial()`), so that part is aligned. There is no in-trial "Continuez à taper" reminder; current feedback is post-trial via freeze-frame error messages (early tap, key release, not enough taps). Retry logic is currently open-ended per `practiceLoop()` (`loop_function: !checkLastTrialSuccess(jsPsych)`), then governed by the outer "Repeat Practice" screen and `MAX_PRACTICE_LOOP_RETRIES`.

**[IMPL]:** Implement a dedicated **Phase 8 dual-key practice block** (separate from generic `practiceLoop`) in `parts/practice.ts` with these concrete changes: (1) replace `interactiveCountdown()` with a static start screen showing "Allez-y ! Maintenez la touche S enfoncée tout au long"; (2) keep the normal countdown as in `countdowntrial` (3) keep `practiceTrial()`/tapping engine with `showThermometer: false`; (3) show a GO cue and then detect insufficient tapping during the active window to display an explicit reminder "Continuez à taper" (either via `tapping-task-trial.ts` runtime message or a new lightweight plugin wrapper for this phase); (4) keep "Relâchez toutes les touches" at trial end using `releaseKeysStep`; (5) implement loop exit rule as researcher-confirmed for this phase: stop after **2 successes OR 3 failures** (whichever comes first), then show "Entraînement réussi" + Continue. Add FR/EN locale keys for new Phase 8 prompts/reminders and keep hand/key interpolation dynamic via `state.getKeySettings()`.

---

## Phase 9 — Practice 3: Max Effort Bar (Calibration)

**Slide:** 10

**Content:**

> Maintenant vous allez vous entraîner à remplir une barre comme sur l'image ici
>
> 1. Allez-y, maintenez la touche S enfoncée tout au long.
> 2. GO! Tapez la touche L de manière répétée **le plus rapidement possible**.
> 3. Le but est de faire monter la barre rouge aussi haut que possible !
>
> Très bien ! *(on success)*

**Flow:** Loop ×3. Red bar visible. Goal: fill bar as high as possible (calibration of maximum effort).

**[DEV NOTE]:** This is the **red bar calibration** phase. It establishes the participant's maximum tapping rate. The red bar should fill based on tap rate. Data collected here calibrates effort levels for the main task. This likely maps to `buildCalibration()` or a sub-phase thereof. Confirm with researcher how max tapping rate is computed across 3 loops (e.g. average, max).

**[CURRENT STATE]:** `buildCalibration()` in `parts/calibration.ts` runs two sequential sub-phases:

- **Part 1** (`CalibrationPartType.CalibrationPart1`): 4 trials (`NUM_CALIBRATION_WITHOUT_FEEDBACK_TRIALS = 4`), no red bar visible (`showThermometer: false`). Preceded by `calibrationSectionDirectionTrial()` (intro screen) and `calibrationPart1InstructionTrial()`. If the median tap count is below `minimumCalibrationMedianTaps`, `conditionalCalibrationTrial()` adds a remedial block.
- **Part 2** (`CalibrationPartType.CalibrationPart2`): 3 trials (`NUM_CALIBRATION_WITH_FEEDBACK_TRIALS = 3`), red bar visible (`showThermometer: true`). Same conditional remedial logic.

After each successful trial, `handleSuccessfulCalibration()` in `jspsych/calibration-trial.ts` calls `calculateMedianTapCount()`, which computes a **statistical median** of the last N tap counts (across all successful trials so far) and stores it in `state.medianTaps.calibrationPart1` / `.calibrationPart2`. This is the value used to scale effort levels in the main task.

**The GSD slide shows only the red bar phase (Part 2 equivalent).** Part 1 (no bar, tap as fast as possible without feedback) is not described in the GSD — it may be an internal warmup the researcher considers transparent to participants.

**The researcher-confirmed adaptive median logic** (see Open Question 2) has NOT yet been implemented: T1 = default 20, T2 = taps from T1, T3 = max(T1, T2), final = max(T2, T3). The current code uses a plain statistical median across all calibration trials, which does not match this spec.

**[IMPL]:** Two changes required:

1. **Text update:** Update `calibrationPart2Stimuli()` in `jspsych/stimulus.ts` and its locale key to match GSD Phase 9 content ("Maintenant vous allez vous entraîner à remplir une barre…"). The existing Part 1 (no-bar) screen can remain as an internal warmup or be relabelled — confirm whether it should be visible to participants or silently skipped.
2. **Adaptive median logic:** Refactor `handleSuccessfulCalibration()` and `calculateMedianTapCount()` in `jspsych/calibration-trial.ts` to implement the researcher-confirmed per-trial seeding: trial 1 uses a default of 20 as the median seed; trial 2 uses the tap count from trial 1; trial 3 uses `max(trial1, trial2)`; final median = `max(trial2, trial3)`. This requires adding a `calibrationTrialTapCounts` array to `ExperimentState` to track individual trial tap counts across the Part 2 loop.

---

## Phase 10 — Practice 4: Target Zone (Blue Bar)

**Slide:** 11

**Content:**

> Entraînement 4
> <+>
> En maintenant la touche S enfoncée, tapez la touche L de manière répétée pour :
>
> Amener et maintenir la barre rouge dans la zone cible bleue.
> Ne dépassez pas la zone cible bleu.
> **Restez à l'intérieur de la zone bleue !**
>
> *Zone cible en bleu*

**Flow:** Loop ×3. Red bar + blue target zone visible. Goal: fill bar to blue zone and maintain.

**[DEV NOTE]:** This introduces the target zone concept used in the main task. The blue zone represents the required effort level. Participant must regulate tap rate to stay within it (not too slow, not too fast). This likely maps to a validation sub-phase. Confirm blue zone position/width parameterisation with researcher.

**[CURRENT STATE]:** `buildValidation()` in `parts/validation.ts` handles this phase. It opens with `validationVideoTutorialTrial()` — an instruction screen that renders `validationVideo()` from `jspsych/stimulus.ts`, which uses the `VALIDATION_VIDEO_TUTORIAL_MESSAGE` i18n key. Current FR text: *"Amenez le haut de la barre rouge dans la zone cible bleue avec vos tapotements ! Ne dépassez pas la zone cible, restez à l'intérieur !"*. After instructions, three sequential `createValidationTrial()` calls run `ValidationEasy` (bounds 5–23%), `ValidationMedium` (41–59%), and `ValidationHard` (77–95%) — each looping up to `NUM_VALIDATION_TRIALS = 4` times with `MAX_VALIDATION_FAILURES = 7` before the participant can proceed. Blue zone bounds are fixed (`BOUNDS_DEFINITIONS` in `constants.ts`), confirmed not calibration-derived (Open Question 4). The thermometer and blue target zone are both visible (`showThermometer: true`). A `likertFinalQuestionAfterValidation()` questionnaire and `validationResultScreen()` close the phase.

**[IMPL]:** **Text-only update.** Update the `VALIDATION_VIDEO_TUTORIAL_MESSAGE` key in `src/locales copy/fr/ns1.json` to match GSD Phase 10 content: *"En maintenant la touche S enfoncée, tapez la touche L de manière répétée pour : Amener et maintenir la barre rouge dans la zone cible bleue. Ne dépassez pas la zone cible bleu. Restez à l'intérieur de la zone bleue !"*. The `validationVideo()` stimulus wrapper in `jspsych/stimulus.ts` also renders a `CALIBRATION_HEADER` + `CALIBRATION_PART() 2` heading — confirm with researcher whether those section labels should be replaced with a Phase 10–appropriate heading (e.g. "Entraînement 4"). No structural or logic changes required for this phase.

---

## Phase 11 — Post-Practice Questionnaire 1

**Slide:** 12

**Content:**

> Dites nous comment vous vous êtes senti-e au cours de cette dernière partie de l'exercice en répondant aux questions suivantes sur une échelle de 1 (très faible) à 7 (très élevé) :
>
> 1. Quel était votre niveau d'attention ?
>    Très faible 1 — 2 — 3 — 4 — 5 — 6 — 7 Très élevé
> 2. Quel était votre niveau de motivation ?
>    Très faible 1 — 2 — 3 — 4 — 5 — 6 — 7 Très élevé
> 3. Quel était le niveau de fatigue musculaire de vos doigts ?
>    Très faible 1 — 2 — 3 — 4 — 5 — 6 — 7 Très élevé
> 4. Quel était votre niveau de fatigue générale ?
>    Très faible 1 — 2 — 3 — 4 — 5 — 6 — 7 Très élevé

**Validation:** If no response: *"Veuillez donner une réponse s'il vous plaît"*

**[DEV NOTE]:** 7-point Likert scale, 4 items. All items required before Continue is enabled. Response data must be saved. This questionnaire appears after Practice 4. A similar questionnaire appears later after the main game blocks — check whether it's the same component reused or a separate one.

**[CURRENT STATE]:** `likertFinalQuestionAfterValidation()` in `trials/likert-trial.ts` is called at the end of `buildValidation()`. It is a separate function from the task-block questionnaires. Item 3 currently hardcodes **"Left Arm"** (muscle fatigue of the left arm) regardless of which hand the participant uses.

**[IMPL]:** Update `likertFinalQuestionAfterValidation()` items to match GSD FR text exactly. Fix item 3 to "de vos doigts" (fingers, not arm). Also try to display all questions on the same page, don't use 4 pages.

---

## Phase 12 — Transition to Game

**Slide:** 13

**Content:**

> Vous allez maintenant entrer dans la prochaine phase du jeu. Appuyez sur le bouton ci-dessous pour continuer.

**UI:** Static transition screen with Continue button and image.

**[CURRENT STATE]:** The `validationResultScreen()` in `jspsych/validation-trial.ts` serves as the transition out of validation. On pass, it displays a success message with a Continue button that advances to `buildTaskCore()`. There is no dedicated Phase 12 transition screen separate from the validation result.

**[IMPL]:** Either update the `validationResultScreen` success text to match GSD Phase 12 content, or add a new static trial after `validationResultScreen` that shows exactly "Vous allez maintenant entrer dans la prochaine phase du jeu." before `buildTaskCore()` begins.

---

## Phase 13 — Game Instructions

**Slide:** 14

**Content:**

> Nous allons maintenant passer au jeu avec les offres pour obtenir des points.
>
> Voici les instructions.
>
> 1. Les touches du clavier que vous devez utiliser restent inchangées.
>    Maintenir la touche S enfoncée avec la main Gauche, tapez la touche L de manière répétée avec la main Droite.
> 2. Cette fois-ci, vous recevrez des offres vous permettant d'obtenir et de cumuler des points.
> 3. Chaque offre propose un nombre de points différents.
>    Le total de points accumulés à la fin du jeu déterminera le montant de la récompense.
> 4. Les offres avec peu de points demandent peu d'effort (frappes sur le clavier).
>    Les offres avec davantage de points demandent plus d'effort.
> 5. Veuillez noter : plus la barre bleue est élevée, plus l'effort à fournir est important.
> 6. Vous pouvez décider si l'effort demandé vaut les points que vous pouvez gagner.
> 7. Vous êtes libre d'accepter ou de refuser les offres qui sont proposées.
> 8. Pour accepter une offre, appuyez sur la flèche de droite ➡️
>    Pour refuser une offre, appuyez sur la flèche de gauche ⬅️
>
> *[Image showing example offers: 10 points (low bar) vs 40 points (high bar)]*
>
> Cliquez sur le bouton ci-dessous pour continuer.

**[DEV NOTE]:** This is the main task instruction screen. The example image should show two offers side-by-side with different bar heights and point values (e.g. 10 pts / low bar, 40 pts / high bar). Arrow key labels ("Pour refuser" left, "Pour accepter" right) should be visible on-screen. This maps to `buildIntroduction()` for the task core or a pre-task instruction trial.

---

## Phase 14 — Game Start Warning

**Slide:** 15

**Content:**

> Le jeu va maintenant commencer. Tenez-vous prêt-e.
>
> **Attention :** Parfois, vous aurez l'impression que la barre bouge différemment. Ne vous inquiétez pas. Jouez du mieux que vous pouvez.
>
> Cliquez sur le bouton ci-dessous pour continuer.

**[DEV NOTE]:** The "bar moves differently" warning is important — it refers to the perturbation manipulation (agency condition). Do not remove this text. Static screen with Continue button. This page replaces the existing page that initiates the practice trials.

---

## Phase 15 — Demo / Mini Game Block (2 Trials)

**Slide:** 16

> **DEMO / GAME — 2 TRIALS**

**[DEV NOTE]:** 2-trial demo/practice block of the full accept/reject + effort task. Participant sees an offer, accepts or rejects via arrow keys, and if accepted, performs the dual-key effort task. These trials likely use the same `buildTaskCore()` logic but with a reduced trial count. Confirm with researcher whether demo feedback differs from main game feedback.

---

## Phase 16 — Post-Demo Questionnaire

**Slide:** 17

**Content:**

> Dites nous comment vous vous êtes senti-e au cours de cette dernière partie de l'expérience en choisissant la réponse qui convient le mieux.
>
> 1. J'avais l'impression de contrôler le mouvement de la barre.
> 2. J'ai trouvé le jeu difficile.

**[DEV NOTE]:** Scale type not specified in slide — confirm with researcher (likely same 7-point Likert, but could be agree/disagree). 2 items. Save responses.

**[CURRENT STATE]:** `likertQuestions1()` in `trials/likert-trial.ts` is called after demo trials. Already 2 items covering control and difficulty. Responses saved.

**[IMPL]:** Update FR text to exactly match GSD wording. Confirm scale type with researcher. Also display both questions on the same page, no longer use two pages.

---

## Phase 17 — Main Game Block (32 Trials)

**Slide:** 18

> **GAME — 32 TRIALS**

**[DEV NOTE]:** Main data collection phase. 32 trials of the accept/reject + effort task. This maps to `buildTaskCore()`. Confirm trial structure (offer display duration, response window, effort window, inter-trial interval) with researcher.

**[CURRENT STATE]:** `createTaskBlockTrials()` in `jspsych/trials.ts` generates trials from `taskPermutationRepetitions × taskBoundsIncluded × taskRewardsIncluded` (configurable via settings). `TRIAL_DURATION = 5000ms`. Each trial includes: acceptance screen (arrow keys) → tapping trial → release keys → success/fail feedback → loading bar.

**[IMPL]:** Trial count (32) is a settings configuration — confirm with researcher and set appropriately in the Graasp app settings (not a code change). Trial structure is already correct. No code change required unless trial timings need adjustment.

---

## Phase 18 — Post-Block Questionnaire 2

**Slide:** 19

**Content:**

> Dites nous comment vous vous êtes senti-e au cours de cette dernière partie de l'expérience en choisissant la réponse qui convient le mieux.
>
> 1. Il était difficile de rester concentré-e sur la tâche.
> 2. Il était difficile de comprendre comment accomplir la tâche avec succès.
> 3. Je me suis senti-e indifférent-e quant à ma performance dans la tâche.
> 4. J'essayais continuellement d'effectuer la tâche de manière plus efficace.
> 5. J'étais satisfait-e en voyant que je réussissais bien la tâche.
> 6. J'ai senti que j'avais besoin d'encouragements pour continuer à taper jusqu'à la fin de la tâche.
>
> Cliquez sur le bouton ci-dessous pour continuer.

**[DEV NOTE]:** 6 items. Scale type not specified — confirm with researcher. These appear to be motivation/apathy-related items. Save all responses.

**[CURRENT STATE]:** `likertQuestions2Randomized(jsPsych)` in `trials/likert-trial.ts` is called after each task block (`generateTaskTrialBlock`). Items are randomized. The current items are similar apathy/motivation items but the exact FR wording differs from the GSD.

**[IMPL]:** Update `likertQuestions2Randomized` items to match GSD Phase 18 FR wording exactly. Scale type: confirm with researcher (7-point assumed). Note: items are currently **randomized** — confirm with researcher whether randomization should be retained or items should appear in fixed order.

---

## Phase 19 — Points Summary

**Slide:** 20

**Content:**

> Vous avez obtenu : **[X] points** au total.
>
> Appuyez sur le bouton ci-dessous pour continuer vers les prochaines séries.

**[DEV NOTE]:** Dynamic display of cumulative points earned in this block. "Prochaines séries" implies multiple blocks — confirm total number of blocks with researcher. Continue button advances to next block.

**[CURRENT STATE]:** `createRewardDisplayTrial()` in `jspsych/trials.ts` shows cumulative points and EUR equivalent. Currently displays both points AND money conversion. `TOTAL_REWARD_MONEY = 6` (EUR) and `CURRENCY = 'EUR'` are hardcoded constants.

**[IMPL]:** Update display text to GSD FR format "Vous avez obtenu : [X] points au total." Consider whether to show money conversion here (not in GSD slide) or only at the very end. `TOTAL_REWARD_MONEY` and `CURRENCY` should ideally become configurable app settings (currently noted as TODO in code).

---

## Phase 20 — Instructions Summary (Between Blocks)

**Slide:** 21

**Content:**

> **Résumé des instructions**
>
> 1. Les touches du clavier que vous devez utiliser restent inchangées.
>    Maintenir la touche S enfoncée avec la main Gauche, tapez la touche L de manière répétée avec la main Droite.
> 2. Vous pouvez décider si l'effort demandé vaut les points que vous pouvez gagner.
> 3. Vous êtes libre d'accepter ou de refuser les offres qui sont proposées.
> 4. Pour accepter une offre, appuyez sur la flèche de droite ➡️
>    Pour refuser une offre, appuyez sur la flèche de gauche ⬅️
>
> *[Image showing example offers: 10 points vs 40 points with arrow key labels]*

**[DEV NOTE]:** Brief reminder screen shown between game blocks. Static, no interaction required beyond Continue. Reuses the offer diagram from Phase 13.

**[CURRENT STATE]:** `rememberEffortRewardTrialDirection()` in `jspsych/trials.ts` uses `rememberDirectionContent()` from `jspsych/stimulus.ts`. It is placed **at the start of the offer trials**, after the demo, within each block — not between blocks. Current block order: demo → `rememberDirection` → trials → questionnaire → reward.

**[IMPL]:** **Reposition.** Move `rememberEffortRewardTrialDirection()` to appear **after the reward display** and **before the next block's demo** — i.e. between blocks, as Phase 20 intends. Update FR text to match GSD "Résumé des instructions" content. Reuse the same offer diagram image from Phase 13.

---

## Phase 21 — Block Repeat (×N)

**Slide:** 22

> **REPEAT SLIDES 16–21**

**[DEV NOTE]:** Phases 15–20 (demo → post-demo Q → 32 trials → post-block Q → points summary → instructions summary) repeat. Confirm total number of repetitions with researcher. The block structure should be implemented as a loop, not duplicated code.

---

## Phase 22 — End-of-Session Calibration Check

**Slide:** 23

**Content:**

> **Test de fin**
>
> Maintenant vous allez vous entraîner à remplir une barre comme sur l'image ici
>
> 1. Allez-y, maintenez la touche S enfoncée tout au long.
> 2. GO! Tapez la touche L de manière répétée **le plus rapidement possible**.
> 3. Le but est de faire monter la barre rouge aussi haut que possible !
>
> Très bien ! *(on success)*

**Flow:** Loop ×3. Identical to Phase 9 (Calibration).

**[DEV NOTE]:** This is an end-of-session re-calibration / effort check — same procedure as Phase 9. The red bar should fill to max. Data collected here can be compared to Phase 9 to assess fatigue effects. Confirm whether this uses the same code path as `buildCalibration()` or is a separate lightweight instance.

**[CURRENT STATE]:** `buildFinalCalibration()` in `parts/calibration.ts` runs Part 1 (3 trials, no bar, `NUM_FINAL_CALIBRATION_TRIALS_PART_1 = 3`) + Part 2 (3 trials, with bar, `NUM_FINAL_CALIBRATION_TRIALS_PART_2 = 3`). Uses the same `calibrationTrial()` function — shared code path confirmed.

**[IMPL]:** The GSD shows a single "Test de fin" section with bar visible (×3). The no-bar Part 1 is not shown in the GSD slide. Options: (a) keep Part 1 as a silent warmup, only update Part 2 text; or (b) remove Part 1 entirely. Update `finalCalibrationPart1Stimuli` / `finalCalibrationPart2Stimuli` in `jspsych/stimulus.ts` to "Test de fin" text. Confirm with researcher.

---

## Open Questions for Researcher

Before starting implementation, confirm:

1. **Dominant hand logic** — does selecting "Right" invert the S/L key assignments, or does S always stay with the left hand? *(Code currently inverts: right dominant → S on right hand, L on left)*
   > It indeed inverts, left hand dominant means tapping with S, holding L; right-hand-dominant is there reverse. The idea is to do tapping with the better hand. S and L are just convenient keys for both hands, so S is always left hand and L is always right hand independent of preference. Only tapping/holding assignment changes.
2. **Calibration computation** — how is max tapping rate computed across 3 loops in Phase 9? *(Code currently uses median across trials)*
   > Yes this is a challenge that I see as well. Because we also now need to set a default initial median as a baseline. Maybe trial 1 has a default (maybe 20) as median taps, then trial 2 has the # of taps from trial 1 as median, and trial 3 has the max between trial 1 and trial 2. The final MTS rate for the experiment is the max between trials 2 and 3.
3. **Practice 2 loop count** — Phase 8 says ×2, is that correct? _(Code currently uses **\*\*\*\*\*\*\***`MAX_PRACTICE_LOOP_RETRIES = 2`**\***)_
   > Good question, I think we should have a max of 3 error trials before continuing in both phase 8 and phase 6 (or whichever is the holding down trial); so they continue either after 2 successes or 3 failures, whichever comes first.
4. **Blue zone parameterisation** — is the blue target zone position/width fixed or derived from calibration? _(Code currently uses fixed **\*\*\*\*\*\*\***`BOUNDS_DEFINITIONS`**\*** — not calibration-derived)_
   > Also good question, let's keep them fixed for now, but this might become a point of contention.
5. **Post-demo questionnaire scale** (Phase 16) — 7-point Likert or binary agree/disagree?
   > 7-point likert.
6. **Post-block questionnaire scale** (Phase 18) — same question *(Code currently uses 7-point Likert)*
   > Also 7-point likert indeed.
7. **Number of game blocks** — how many times does the Phase 15–20 loop repeat? *(Configurable via Graasp settings: \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\`taskBlockRepetitions × taskBlocksIncluded.length\`\*\*\*\*\*)*
   > This is something that comes from the settings indeed, not something we will hard-code, most likely either 6 or 8 though.
8. **Demo trials** — do the 2 demo trials in Phase 15 use the same trial structure as the 32 main trials? *(Code uses same \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\`generateTaskTrial()\`\*\*\*\*\* — confirmed shared path)*
   > Yes, they just do not have a preceding offer/thermometer.
9. **Perturbation / agency condition** — the "bar moves differently" warning (Phase 14) implies a manipulation; is this already implemented? *(Yes — \*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\`DelayType.WideAsync\`\*\*\*\*\* delays the bar response by 0–1000ms; this is the agency manipulation)*
   > Correct, this has been done already and is this wideasync setup.
10. **Final calibration Part 1** — should the no-bar warmup (3 trials) be kept before the "Test de fin" bar phase, or removed entirely?
    > Part 1 is removed entirely, part 2 should follow thesame logic as described for question 2.
11. **New image assets** — keyboard images with colour-coded S key (Phase 5), dual-key S+L (Phase 7), and two-offer comparison diagram (Phase 13) — do these exist or need to be created?
    > Phase 5 and Phase 7 use (hand-l-1.png and hand-l-3.png respectively for left-handed and hand-r-1.png and hand-r-3.png for right-handed) for Phase 13 there is two-offer-view.png all in public/assets/images/...
