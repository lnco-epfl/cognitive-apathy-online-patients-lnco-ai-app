# CONCERNS
_Last updated: 2026-04-07_

## Summary
This is a PD-patient-facing online experiment where French localization and accessibility are critical. Key concerns center around hardcoded English strings bypassing i18n (especially in TTS controls visible to patients), a voice race condition in speech synthesis, and touch/click targets too small for PD motor impairment. Testing coverage is minimal (stubs only), and there is no consent screen in the experiment timeline.

---

## Localization Gaps (High Priority — PD Patients See French)

### Hardcoded English strings not going through i18n
The following UI elements are always shown in English regardless of `?lang=fr`:

- **TTS control labels** in [speech.ts](src/modules/experiment/jspsych/speech.ts): "Audio instructions", "Play", "Pause", "Restart", "Stop", "Speed", "Resume", unsupported-browser notice
- **Instruction modal navigation** in [instruction-modal.ts](src/modules/experiment/utils/instruction-modal.ts): "Back to Menu", "Previous", "Next", "Finish", "Instructions"
- **Fullscreen button** in [experiment.ts](src/modules/experiment/experiment.ts)

### Dual i18n systems
Two separate i18n setups exist:
1. `src/config/i18n.ts` — react-i18next, loads from `src/langs/` (used by React UI shell)
2. `src/modules/experiment/jspsych/i18n.ts` — bare i18next, loads from `src/locales copy/` (used by all experiment content)

The directory name `src/locales copy/` contains a space — fragile for build tooling and shell scripts.

### Missing i18n keys
`FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_1` and `FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_2` are exported from [constants.ts](src/modules/experiment/utils/constants.ts) and call `i18n.t()`, but the keys are absent from both `src/locales copy/en/ns1.json` and `src/locales copy/fr/ns1.json`. Participants would see the raw key name.

### `<html lang="">` not updated
When the language is set via `?lang=fr`, the `<html lang="">` attribute is not updated. Screen readers and assistive technology rely on this.

---

## Accessibility — PD Patient Concerns (High Priority)

### TTS button touch targets too small
TTS control buttons use inline CSS `padding: 6px 10px; font-size: 13px`, bypassing the `pd-accessibility.css` rule requiring `min-height: 60px`. Motor-impaired patients may find these hard to tap.

### Instruction modal has no ARIA
The instruction modal in [instruction-modal.ts](src/modules/experiment/utils/instruction-modal.ts) lacks:
- `role="dialog"` / `aria-modal="true"`
- Focus trap (Tab key cycles outside modal)
- Escape key handler to close
- `aria-labelledby` for the modal title

---

## Speech Synthesis (Medium Priority)

### Voice race condition
`getVoice()` in [speech.ts](src/modules/experiment/jspsych/speech.ts) calls `window.speechSynthesis.getVoices()` synchronously with no `voiceschanged` event listener. In Chrome, the voices list is empty on the first synchronous call. The wrong or no voice may be selected on the first TTS play, causing silent or incorrect-language audio.

---

## Content / Data Issues

### Likert fatigue question hardcodes "Left Arm"
Survey 3, Question 3 in [likert-trial.ts](src/modules/experiment/trials/likert-trial.ts) always reads "Level of Muscular Fatigue of the Left Arm" regardless of which hand the participant used during tapping.

### `TOTAL_REWARD_MONEY` and `CURRENCY` hardcoded
A TODO comment exists at the usage site. These should be configurable app settings rather than compile-time constants.

### No consent screen
There is no informed consent screen in the experiment timeline. Required for patient-facing research.

---

## Agency Task

### Agency task is commented out
The agency task import/inclusion is commented out in [experiment.ts](src/modules/experiment/experiment.ts). It is unclear whether this is intentional (feature flag) or a leftover from debugging.

---

## Testing (Low Coverage)

### E2E tests are stubs
Tests only assert "renders player view text". No experiment flow, ADO math, calibration logic, or reward computation is tested. Critical decision-making logic in `ado/` has zero test coverage.

---

## Technical Debt

### `src/locales copy/` directory
The directory name with a space is unusual. There are also backup/draft files (`ns1-old.json`, `ns1-rewritten.json`) mixed in with production locale files. These should be cleaned up or moved.

### `src/modules/main/data/test.json`
Purpose unclear — appears to be a dev fixture left in the source tree.
