# Requirements — EBDM Experiment Flow Update

_Generated: 2026-04-07_

## Introduction Flow (Phases 1–4)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-001 | Welcome screen title reads "Expérience d'effort et de prise de décision" in FR | Must |
| REQ-002 | Welcome screen button reads "Commencer" (not "Start") in FR | Must |
| REQ-003 | Seating instruction text updated to GSD Phase 2 FR wording | Must |
| REQ-004 | Task overview text rewritten to game/offers/points framing (not measurement framing) | Must |
| REQ-005 | Dominant hand selection shows "Droite" first, "Gauche" second | Must |
| REQ-006 | All introduction screens have EN equivalents that mirror FR framing | Must |

## Practice Flow (Phases 5–8)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-007 | New Phase 5 static instruction screen: S-key only, keyboard image with blue S key, `hand-l-1.png`/`hand-r-1.png` based on hand selection | Must |
| REQ-008 | New Phase 6 active hold-key practice trial: hold S ~5s, release on prompt, success/retry feedback | Must |
| REQ-009 | Phase 6 loop: advance after 2 successes OR 3 failures, whichever comes first | Must |
| REQ-010 | Phase 7 dual-key instruction screen replaces current 5-page sequence; uses `hand-l-3.png`/`hand-r-3.png` | Must |
| REQ-011 | Phase 8 dual-key practice runs with `showThermometer: false` (no bar visible) | Must |
| REQ-012 | Phase 8 removes freeze-frame coaching sequence; plain loop ×2 success or ×3 failure | Must |
| REQ-013 | Phase 8 "Entraînement réussi" screen shown after successful completion | Must |

## Calibration (Phase 9)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-014 | Calibration uses new adaptive median logic: T1=default 20, T2=T1 taps, T3=max(T1,T2), final=max(T2,T3) | Must |
| REQ-015 | Calibration instruction text updated to GSD Phase 9 FR wording | Must |
| REQ-016 | Calibration Part 1 (no-bar warmup) retained; Part 2 (with bar) follows new median logic | Must |

## Validation / Blue Bar (Phase 10)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-017 | Video tutorial replaced with static text+image instruction screen matching GSD Phase 10 FR | Must |
| REQ-018 | Validation instruction text describes: hold S, tap L, get bar into blue zone, stay inside | Must |

## Post-Practice Questionnaire (Phase 11)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-019 | Questionnaire has 4 items: attention, motivation, finger fatigue ("vos doigts"), general fatigue | Must |
| REQ-020 | Item 3 no longer hardcodes "Left Arm" — uses "vos doigts" | Must |
| REQ-021 | All items use 7-point Likert scale (Très faible → Très élevé) | Must |

## Transition to Game (Phase 12)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-022 | Transition screen shows "Vous allez maintenant entrer dans la prochaine phase du jeu." before task core begins | Must |

## Game Instructions (Phases 13–14)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-023 | Game instructions screen shows 8-point numbered list in FR with `two-offer-view.png` image | Must |
| REQ-024 | Arrow key labels (⬅️ refuser / ➡️ accepter) shown on instruction screen | Must |
| REQ-025 | Game start warning is a standalone screen: "Le jeu va maintenant commencer" + perturbation warning | Must |
| REQ-026 | Perturbation warning text ("barre bouge différemment") preserved exactly | Must |

## Task Blocks (Phases 15–21)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-027 | Demo trials count confirmed configurable; structure uses existing `generateTaskTrial()` without offer screen | Must |
| REQ-028 | Post-demo questionnaire (Phase 16) items updated to exact GSD FR wording; 7-point Likert | Must |
| REQ-029 | Post-block questionnaire (Phase 18) 6 items updated to exact GSD FR wording; 7-point Likert | Must |
| REQ-030 | Post-block questionnaire randomization retained (confirm with researcher) | Should |
| REQ-031 | Points summary (Phase 19) displays "Vous avez obtenu : [X] points au total." | Must |
| REQ-032 | Instructions summary (Phase 20) repositioned to appear after reward display, before next block's demo | Must |
| REQ-033 | Instructions summary uses GSD "Résumé des instructions" content with `two-offer-view.png` | Must |

## Final Calibration (Phase 22)

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-034 | Final calibration Part 1 (no-bar warmup) removed entirely | Must |
| REQ-035 | Final calibration Part 2 follows same adaptive median logic as REQ-014 | Must |
| REQ-036 | Final calibration instruction text updated to "Test de fin" GSD wording | Must |

## Cross-Cutting

| ID | Requirement | Priority |
|----|-------------|----------|
| REQ-037 | All FR locale keys updated consistently in `src/locales copy/fr/ns1.json` | Must |
| REQ-038 | All EN locale keys updated to mirror FR framing in `src/locales copy/en/ns1.json` | Must |
| REQ-039 | All instruction text referring to hands uses dynamic key settings from `state.getKeySettings()` | Must |
| REQ-040 | No regression in data saving, settings, progress bar, or reload/resume flow | Must |
