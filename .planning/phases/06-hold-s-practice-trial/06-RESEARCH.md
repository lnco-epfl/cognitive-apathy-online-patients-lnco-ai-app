# Phase 6: Hold-S Practice Trial — Research

**Researched:** 2026-04-07
**Domain:** jsPsych custom plugin class, keyboard event handling, trial loop logic
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-008 | New Phase 6 active hold-key practice trial: hold S ~5s, release on prompt, success/retry feedback | New plugin class `HoldKeyPracticePlugin` using `document.addEventListener('keydown'/'keyup')` — identical pattern to `CountdownTrialPlugin` |
| REQ-009 | Phase 6 loop: advance after 2 successes OR 3 failures, whichever comes first | `loop_function` in `practice.ts` using local counters; researcher confirmed: 2 successes or 3 failures |
| REQ-037 | All FR locale keys updated consistently in `src/locales copy/fr/ns1.json` | New locale keys to add: `HOLD_S_PROMPT`, `RELEASE_KEY_PROMPT`, `HOLD_S_SUCCESS`, `HOLD_S_RETRY`, `HOLD_S_PRACTICE_COMPLETE` |
| REQ-038 | All EN locale keys updated to mirror FR framing in `src/locales copy/en/ns1.json` | Same keys with EN equivalents |
</phase_requirements>

---

## Summary

Phase 6 requires building a new jsPsych plugin class (`HoldKeyPracticePlugin`) that runs a single-key hold trial: the participant holds the S key for ~5 seconds, sees a release prompt, releases on cue, and receives success or retry feedback. The loop around this trial exits after 2 successes or 3 failures (researcher-confirmed in `docs/EBDM_Task_Instructions_GSD.md` open questions section). After the loop ends, a static "Entraînement réussi" screen with a Continue button is shown.

The codebase already has two fully-functional plugin classes (`CountdownTrialPlugin` and `TappingTask`) that use `document.addEventListener('keydown', handleKeyDown)` and `document.addEventListener('keyup', handleKeyUp)` directly. The `CountdownTrialPlugin` is the closest analogue: it tracks which keys are held, waits for a condition (all keys held), and then runs a timed sequence. Phase 6 reuses this exact keydown/keyup pattern but replaces the countdown sequence with: (1) wait for S held ≥ 5 seconds, (2) show "Relâchez la touche", (3) wait for S released, (4) show "Très bien !" + checkmark, (5) end with `success: true`. If S is released before 5 seconds, end with `success: false`.

The outer loop structure in `practice.ts` already demonstrates how `loop_function` tracks trial outcomes — the existing `practiceLoop` loops indefinitely while `!checkLastTrialSuccess(jsPsych)`. Phase 6 needs a finite loop with counters, which is best implemented as a wrapper in `practice.ts` using local `successCount` and `failureCount` variables captured in the `loop_function` closure.

**Primary recommendation:** Build `HoldKeyPracticePlugin` as a new file `src/modules/experiment/trials/hold-key-practice-trial.ts`, add a `holdKeyPracticeBlock()` factory function in `practice.ts`, add 3 constants to `constants.ts`, add 5 locale keys to each locale file, then insert `holdKeyPracticeBlock()` into `buildPracticeTrials()` between `sKeyInstructionTrial` and `tappingInstructionsTimeline`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jspsych | (existing) | Plugin base class, `jsPsych.finishTrial()`, `jsPsych.pluginAPI.setTimeout()` | Already used by all plugins in codebase |
| `@jspsych/plugin-html-button-response` | (existing) | "Entraînement réussi" end screen | Already used in `practice.ts` for all button screens |
| TypeScript | (existing) | Type definitions for plugin parameters | Entire codebase is TypeScript |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| i18n (existing) | (existing) | `i18n.t()` calls for all user-visible strings | All strings go through i18n per codebase convention |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New plugin class | `HtmlButtonResponsePlugin` with injected JS | Injected JS in stimulus HTML is fragile, untestable, and violates established pattern. New plugin class is the clear standard. |
| `loop_function` with counter closure | `jsPsych.data.filter()` to count past trials | Closure is simpler for this specific case; data filtering is used elsewhere for different purposes |

---

## Architecture Patterns

### Recommended Project Structure
```
src/modules/experiment/
├── trials/
│   ├── hold-key-practice-trial.ts   ← NEW FILE (HoldKeyPracticePlugin)
│   ├── countdown-trial.ts           (reference model)
│   └── ...
├── parts/
│   └── practice.ts                  (add holdKeyPracticeBlock() factory + insert into buildPracticeTrials())
└── utils/
    └── constants.ts                 (add 3 new constants)
```

### Pattern 1: jsPsych Plugin Class with Keydown/Keyup
**What:** A TypeScript class with `static info` (name, version, parameters, data) and a `trial(displayElement, trial)` method. The method imperatively manages DOM, event listeners, timers, and calls `this.jsPsych.finishTrial(data)` to end.
**When to use:** Any interactive trial that requires real-time keyboard state tracking — the established pattern for every custom trial in this codebase.

**Example (from `countdown-trial.ts`):**
```typescript
// Source: src/modules/experiment/trials/countdown-trial.ts
export class CountdownTrialPlugin {
  static info = {
    name: 'countdown-trial',
    version: '1.0',
    data: { task: { type: ParameterType.STRING }, keyTappedEarlyFlag: { type: ParameterType.BOOL } },
    parameters: {
      keysToHold: { type: ParameterType.STRING, array: true },
      waitTime: { type: ParameterType.INT, default: COUNTDOWN_TIME },
      // ...
    },
  };

  jsPsych: JsPsych;
  constructor(jsPsych: JsPsych) { this.jsPsych = jsPsych; }

  trial(displayElement: HTMLElement, trial: CountdownTrialType): void {
    const keysState: { [key: string]: boolean } = {};
    trial.keysToHold.forEach((key) => { keysState[key.toLowerCase()] = false; });

    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if ((trial.keysToHold || []).includes(key)) {
        keysState[key] = true;
        setAreKeysHeld();
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => { /* mirror */ };

    const endTrial = (): void => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      displayElement.innerHTML = '';
      this.jsPsych.finishTrial({ task: 'countdown', keyTappedEarlyFlag: trial.keyTappedEarlyFlag });
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    // ... imperative timer + DOM logic
  }
}
```

**Key points:**
- Event listeners are added with `document.addEventListener` (not `jsPsych.pluginAPI`)
- Listeners are removed in `endTrial()` before calling `finishTrial()`
- Timers use `window.setInterval` / `window.setTimeout` (NOT `jsPsych.pluginAPI.setTimeout` — the existing plugins mix both; use `window.setTimeout` to keep consistent with countdown-trial)
- `displayElement.innerHTML = ''` clears DOM before `finishTrial()`

### Pattern 2: `loop_function` in practice.ts for capped retry loops
**What:** A `timeline` node with a nested `loop_function` that returns `true` to repeat. For a success/failure cap, use closure-captured counters.
**When to use:** Any practice block with explicit pass/fail exit conditions.

**Example (adapted pattern for Phase 6):**
```typescript
// Source pattern: src/modules/experiment/parts/practice.ts (practiceLoop)
export const holdKeyPracticeBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
): Trial => {
  let successCount = 0;
  let failureCount = 0;

  return {
    timeline: [
      {
        timeline: [holdKeyPracticeTrial(state)],
        loop_function() {
          const lastTrial = jsPsych.data.get().last(1).values()[0];
          if (lastTrial?.success === true) {
            successCount += 1;
          } else {
            failureCount += 1;
          }
          // Exit when 2 successes OR 3 failures reached
          return successCount < HOLD_KEY_MIN_SUCCESSES && failureCount < HOLD_KEY_MAX_FAILURES;
        },
      },
      holdKeyPracticeEndScreen(),  // "Entraînement réussi" + Continue
    ],
  };
};
```

### Pattern 3: Phase 6 State Machine Inside the Plugin
The plugin trial method needs a 4-state machine:

| State | Display | Trigger to advance |
|-------|---------|-------------------|
| `idle` | "À vous d'essayer! Maintenez la touche S..." | S keydown |
| `holding` | (silent — tracking hold duration) | S held ≥ 5000ms → advance to `release_prompt` |
| `release_prompt` | "Relâchez la touche" | S keyup → `success`, premature S keyup before 5s → `failure` |
| `feedback` | "Très bien !" + checkmark OR retry message | Auto-advance after brief delay → `endTrial(success)` |

The existing `REHOLD_TIMEOUT = 500` grace period in `CountdownTrialPlugin` shows how the codebase handles brief key releases during hold — Phase 6 can apply the same logic (500ms grace window before declaring failure).

### Anti-Patterns to Avoid
- **Injecting JavaScript into `stimulus` HTML string:** Fragile, no TypeScript safety, breaks established plugin pattern. Use a plugin class.
- **Using `jsPsych.pluginAPI.getKeyboardResponse` for hold detection:** `pluginAPI` keydown detection only fires once per keydown event; sustained hold detection requires tracking state with `keydown`/`keyup` pair. All existing plugins use `document.addEventListener` directly.
- **Putting loop counter state inside jsPsych trial data and filtering it:** Workable but verbose for a simple 2/3 counter. Closure is idiomatic in this codebase.
- **Calling `finishTrial` without removing event listeners:** The existing `endTrial()` pattern always removes listeners first. Missing this causes ghost listeners persisting across trials.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hold-key detection | Custom timing system | `document.addEventListener('keydown'/'keyup')` + `performance.now()` (already in CountdownTrialPlugin) | Tested pattern already handles edge cases like rapid re-press and rehold grace period |
| "Release prompt" timing | Custom CSS animations | Inline `style` on `displayElement.innerHTML` (codebase convention) | All existing trials use direct innerHTML; no CSS animation framework used anywhere |
| "Très bien !" checkmark | Custom SVG or image | Inline HTML with `✓` in a green circle (already in CountdownTrialPlugin `showFreezeFrame` and `SuccessScreenPlugin`) | Identical UI already exists in codebase |
| End-of-loop screen | Custom plugin | `HtmlButtonResponsePlugin` (existing) | All static screens with Continue buttons use this plugin |
| i18n string lookup | `document.getElementById` content swapping | `i18n.t('KEY_NAME')` pattern via `constants.ts` wrapper functions | Every string in the codebase goes through this layer |

---

## Common Pitfalls

### Pitfall 1: Event Listener Leak on Trial End
**What goes wrong:** If `endTrial()` is called without first removing `handleKeyDown` and `handleKeyUp`, the listeners persist into the next trial, causing double-firing on key events.
**Why it happens:** `jsPsych.finishTrial()` does not automatically clean up `document.addEventListener` calls.
**How to avoid:** Always call `document.removeEventListener('keydown', handleKeyDown)` and `document.removeEventListener('keyup', handleKeyUp)` inside `endTrial()` before `this.jsPsych.finishTrial()`. This is the established pattern in both `CountdownTrialPlugin` and `TappingTask`.
**Warning signs:** Keys from the hold trial seem to "carry over" into the next countdown or tapping trial.

### Pitfall 2: `loop_function` Counter Not Reset Between Practice Restarts
**What goes wrong:** If the participant uses the existing outer "Repeat Practice" loop (from `endOfPracticeRetryTrial`), the `successCount` and `failureCount` closures from the first run are stale and the loop exits immediately on second run.
**Why it happens:** The counters are captured in a closure at factory call time, but `buildPracticeTrials()` creates the block once. The existing `practiceLoop` avoids this because it re-calls `checkLastTrialSuccess` which reads live jsPsych data.
**How to avoid:** Either reset counters via an `on_timeline_start` callback, or restructure so counters are re-initialized inside `loop_function` on a fresh pass. The safest approach: read counters from `jsPsych.data` filtered by a unique `task` label (e.g. `task: 'hold-key-practice'`) rather than closure variables — this survives outer loop restarts naturally.
**Warning signs:** Loop exits after 0 trials on second run, or count appears stale.

### Pitfall 3: Release Prompt Showing Too Early (Premature S Key Release)
**What goes wrong:** S is released during the `holding` state (before 5 seconds). The plugin must show the retry message, NOT the release prompt.
**Why it happens:** The `release_prompt` state and the `holding` → `failure` transition both involve a `keyup` event for S. They must be gated by hold duration.
**How to avoid:** Track `holdStartTime = performance.now()` on S keydown. In `handleKeyUp`, compare `performance.now() - holdStartTime` against `HOLD_KEY_PRACTICE_DURATION * 1000`. Only transition to `release_prompt` if duration met; otherwise transition to `failure` feedback.

### Pitfall 4: `window.setTimeout` vs `jsPsych.pluginAPI.setTimeout`
**What goes wrong:** Using `window.setTimeout` inside a jsPsych plugin is generally fine (as CountdownTrialPlugin does), but `jsPsych.pluginAPI.setTimeout` is automatically cleared when the trial ends. If a timer fires after `finishTrial()` due to async ordering, it can cause DOM mutations on the next trial's element.
**Why it happens:** `finishTrial()` replaces `displayElement.innerHTML` asynchronously.
**How to avoid:** Track all timeout IDs and clear them in `endTrial()`, the same way `CountdownTrialPlugin` clears `interval`, `freezeFrameInterval`, and `reholdTimeout` before calling `finishTrial`.

### Pitfall 5: `loop_function` Data Reading Timing
**What goes wrong:** `loop_function` runs after the timeline completes a pass. Reading `jsPsych.data.get().last(1)` inside `loop_function` returns data from the very last trial in the timeline (the `hold-key-practice` trial itself). This is correct — but if the "Entraînement réussi" screen is INSIDE the looping node rather than outside it, it will appear on every loop iteration.
**Why it happens:** The end screen must be placed OUTSIDE the looping inner node, inside the outer wrapper.
**How to avoid:** Structure as two nested timeline nodes: inner node (looping trial), outer node (end screen after loop exits). See Pattern 2 above.

---

## Code Examples

### HoldKeyPracticePlugin — Skeleton
```typescript
// File: src/modules/experiment/trials/hold-key-practice-trial.ts
import { JsPsych, ParameterType } from 'jspsych';
import { HOLD_KEY_PRACTICE_DURATION, REHOLD_TIMEOUT } from '../utils/constants';

export type HoldKeyPracticeTrialType = {
  holdKey: string;
  holdDuration: number;
};

export class HoldKeyPracticePlugin {
  static info = {
    name: 'hold-key-practice',
    version: '1.0',
    data: {
      task: { type: ParameterType.STRING },
      success: { type: ParameterType.BOOL },
    },
    parameters: {
      holdKey: { type: ParameterType.STRING },
      holdDuration: { type: ParameterType.INT, default: HOLD_KEY_PRACTICE_DURATION },
    },
  };

  jsPsych: JsPsych;
  constructor(jsPsych: JsPsych) { this.jsPsych = jsPsych; }

  trial(displayElement: HTMLElement, trial: HoldKeyPracticeTrialType): void {
    let holdStartTime: number | null = null;
    let holdTimer: number | null = null;
    let trialEnded = false;

    const endTrial = (success: boolean): void => {
      if (trialEnded) return;
      trialEnded = true;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      displayElement.innerHTML = '';
      this.jsPsych.finishTrial({ task: 'hold-key-practice', success });
    };

    const showFeedback = (success: boolean): void => {
      // Show "Très bien !" + checkmark OR "Maintenez la touche S enfoncée"
      // then call endTrial(success) after brief delay
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === trial.holdKey.toLowerCase() && !holdStartTime) {
        holdStartTime = performance.now();
        holdTimer = window.setTimeout(() => {
          // 5 seconds elapsed — show release prompt
          showReleasePrompt();
        }, trial.holdDuration * 1000);
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== trial.holdKey.toLowerCase()) return;
      if (holdTimer) {
        // Released before 5s: failure
        clearTimeout(holdTimer);
        holdTimer = null;
        holdStartTime = null;
        showFeedback(false);
      } else {
        // Released after 5s (release prompt was shown): success
        showFeedback(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Show initial prompt
    displayElement.innerHTML = `<p>À vous d'essayer ! Maintenez la touche S enfoncée.</p>`;
  }
}
```

### `holdKeyPracticeBlock()` Factory in practice.ts
```typescript
// Add to: src/modules/experiment/parts/practice.ts
import { HoldKeyPracticePlugin } from '../trials/hold-key-practice-trial';
import {
  HOLD_KEY_MIN_SUCCESSES,
  HOLD_KEY_MAX_FAILURES,
  HOLD_S_PRACTICE_COMPLETE_MESSAGE,
  CONTINUE_BUTTON_MESSAGE,
} from '../utils/constants';

export const holdKeyPracticeBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
): Trial => ({
  timeline: [
    {
      timeline: [
        {
          type: HoldKeyPracticePlugin,
          holdKey() { return getHoldKeys(state)[0]; }, // S key (hold key)
          holdDuration: HOLD_KEY_PRACTICE_DURATION,
          data: { task: 'hold-key-practice' },
        },
      ],
      loop_function() {
        const practiceTrials = jsPsych.data
          .filter({ task: 'hold-key-practice' })
          .values();
        const successes = practiceTrials.filter((t) => t.success === true).length;
        const failures = practiceTrials.filter((t) => t.success === false).length;
        return successes < HOLD_KEY_MIN_SUCCESSES && failures < HOLD_KEY_MAX_FAILURES;
      },
    },
    // End screen — outside the looping node
    {
      type: HtmlButtonResponsePlugin,
      stimulus: () => HOLD_S_PRACTICE_COMPLETE_MESSAGE(),
      choices: [CONTINUE_BUTTON_MESSAGE()],
    },
  ],
});
```

### Constants to Add in constants.ts
```typescript
// Add to: src/modules/experiment/utils/constants.ts
export const HOLD_KEY_PRACTICE_DURATION = 5; // seconds (integer, matches waitTime convention)
export const HOLD_KEY_MIN_SUCCESSES = 2;
export const HOLD_KEY_MAX_FAILURES = 3;

export const HOLD_S_PROMPT_MESSAGE = (holdKey: string): string =>
  i18n.t('HOLD_S_PROMPT_MESSAGE', { HOLD_KEY: toName(holdKey) });

export const HOLD_S_RELEASE_PROMPT = (): string =>
  i18n.t('HOLD_S_RELEASE_PROMPT');

export const HOLD_S_SUCCESS_MESSAGE = (): string =>
  i18n.t('HOLD_S_SUCCESS_MESSAGE');

export const HOLD_S_RETRY_MESSAGE = (holdKey: string): string =>
  i18n.t('HOLD_S_RETRY_MESSAGE', { HOLD_KEY: toName(holdKey) });

export const HOLD_S_PRACTICE_COMPLETE_MESSAGE = (): string =>
  i18n.t('HOLD_S_PRACTICE_COMPLETE_MESSAGE');
```

### Locale Keys to Add (FR)
```json
// src/locales copy/fr/ns1.json — new keys
"HOLD_S_PROMPT_MESSAGE": "À vous d'essayer !<br>Avec l'index ou le majeur de la main Gauche, maintenez la touche <b>{{HOLD_KEY}}</b> du clavier jusqu'à ce qu'on vous demande d'arrêter.<br><br>Allez-y !",
"HOLD_S_RELEASE_PROMPT": "Relâchez la touche",
"HOLD_S_SUCCESS_MESSAGE": "Très bien !",
"HOLD_S_RETRY_MESSAGE": "Maintenez la touche <b>{{HOLD_KEY}}</b> enfoncée",
"HOLD_S_PRACTICE_COMPLETE_MESSAGE": "<h2>Entraînement réussi</h2><p>Maintenant cliquez sur «Continuer» pour passer à l'étape suivante.</p>"
```

### Locale Keys to Add (EN)
```json
// src/locales copy/en/ns1.json — new keys
"HOLD_S_PROMPT_MESSAGE": "Your turn!<br>Using your index or middle finger of your left hand, hold down the <b>{{HOLD_KEY}}</b> key until you are told to stop.<br><br>Go ahead!",
"HOLD_S_RELEASE_PROMPT": "Release the key",
"HOLD_S_SUCCESS_MESSAGE": "Well done!",
"HOLD_S_RETRY_MESSAGE": "Keep holding the <b>{{HOLD_KEY}}</b> key down",
"HOLD_S_PRACTICE_COMPLETE_MESSAGE": "<h2>Practice completed successfully</h2><p>Now click «Continue» to move to the next step.</p>"
```

### Insertion Point in buildPracticeTrials()
```typescript
// src/modules/experiment/parts/practice.ts — buildPracticeTrials()
// BEFORE (current order):
// [sKeyInstructionTrial, tappingInstructionsTimeline, practiceLoop(×N), endOfPracticeRetryTrial]

// AFTER Phase 6 insertion:
const practiceBlock: Trial = {
  timeline: [
    sKeyInstructionTrial(state),          // Phase 5 (existing)
    holdKeyPracticeBlock(jsPsych, state), // Phase 6 (NEW)
    tappingInstructionsTimeline(state),   // Phase 7 (now reduced to single screen)
    practiceLoop(jsPsych, state, deviceInfo, true),
    ...
    endOfPracticeRetryTrial(jsPsych, state),
  ],
  loop_function: () => { /* existing */ },
};
```

---

## Locale Keys Already Usable

Several existing locale keys partially overlap but do NOT match Phase 6 requirements:

| Existing Key | Current Value | Phase 6 Use |
|---|---|---|
| `RELEASE_KEYS_MESSAGE` | "Relâchez toutes les touches" | Close but GSD says "Relâchez la touche" (singular) — add new key |
| `TRIAL_SUCCEEDED` | "Essai réussi" | Different context (full tapping trial) — add new key for hold-S success |
| `HOLD_KEYS_MESSAGE` | "Maintenez les touches {{HOLD_KEYS_REPLACE}} enfoncées !" | For countdown trial prompt — Phase 6 has different framing |
| `PRACTICE_ENDING_TITLE` | "Well done! You have completed the practice trials." | This is for the outer practice loop, NOT Phase 6's inner success screen — do NOT reuse |

Conclusion: All 5 Phase 6 strings require new locale keys. No safe reuse without semantic conflict.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Practice goes directly to dual-key | Phase 5 (S-key intro) + Phase 6 (S-key hold) + Phase 7 (dual-key) | This update | Requires new plugin + new block factory |
| No cap on practice loop failures | 2 successes OR 3 failures exit | Researcher decision (GSD doc open question answer) | `loop_function` must check both counters |

---

## Open Questions

1. **Hold key identity for right-handed participants**
   - What we know: `getHoldKeys(state)` returns the hold key array from state. For left-dominant: hold key is the non-dominant key (S). For right-dominant: hold key inverts to L (tapping is with left, holding with right).
   - What's unclear: Phase 6 GSD text says "main Gauche" and "touche S" — but REQ-039 says dynamic from `state.getKeySettings()`. The researcher confirmed S is always left hand regardless of dominant hand.
   - Recommendation: Use `getHoldKeys(state)[0]` via existing utility — this already handles the hand inversion.

2. **"Entraînement réussi" screen placement**
   - What we know: Phase 6 has its own end screen; Phase 8 also ends with "Entraînement réussi". These are separate screens.
   - What's unclear: Should they share the same locale key?
   - Recommendation: Use distinct locale keys (`HOLD_S_PRACTICE_COMPLETE_MESSAGE` for Phase 6, separate key for Phase 8) to allow independent text changes.

3. **Data saved vs. not saved**
   - What we know: `jsPsych.finishTrial()` stores data. The hold-key practice trial data (`success: bool`) should be tagged with `task: 'hold-key-practice'` so the `loop_function` can filter it reliably.
   - Recommendation: Add `data: { task: 'hold-key-practice' }` as a parameter default in the plugin's `static info`.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is a pure code change with no external tool dependencies. No CLI tools, databases, or external services required.

---

## Validation Architecture

No automated test infrastructure detected for this codebase (no `jest.config.*`, `vitest.config.*`, or `tests/` directory found). Validation for Phase 6 is manual browser testing.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-008 | Hold S ≥5s → release prompt → release → "Très bien !" | manual | n/a | n/a |
| REQ-008 | Release S before 5s → retry message shown | manual | n/a | n/a |
| REQ-009 | Loop exits after 2 successes | manual | n/a | n/a |
| REQ-009 | Loop exits after 3 failures | manual | n/a | n/a |
| REQ-009 | "Entraînement réussi" screen appears after loop | manual | n/a | n/a |
| REQ-037/038 | FR and EN locale keys render in trial | manual | n/a | n/a |

### Manual Verification Checklist
- [ ] Hold S for 5+ seconds: "Relâchez la touche" appears
- [ ] Release S after prompt: "Très bien !" + checkmark appears, trial ends with `success: true`
- [ ] Release S before 5 seconds: "Maintenez la touche S enfoncée" appears, trial ends with `success: false`
- [ ] After 2 successful completions: loop exits, "Entraînement réussi" screen shown
- [ ] After 3 failures (without 2 successes): loop exits, "Entraînement réussi" screen shown
- [ ] If 1 success + 3 failures: loop exits (failure threshold reached)
- [ ] "Entraînement réussi" Continue button advances to Phase 7 (dual-key instruction)
- [ ] FR locale: all 5 new strings render correctly in French UI
- [ ] EN locale: all 5 new strings render correctly in English UI
- [ ] No keyboard event leak: next trial (tapping instructions) has no phantom S keydown events

---

## Sources

### Primary (HIGH confidence)
- Direct code reading: `src/modules/experiment/trials/countdown-trial.ts` — keydown/keyup pattern, plugin class structure, timer cleanup
- Direct code reading: `src/modules/experiment/trials/tapping-task-trial.ts` — keysState tracking, rehold timeout, `endTrial` pattern
- Direct code reading: `src/modules/experiment/parts/practice.ts` — `practiceLoop`, `loop_function`, `endOfPracticeRetryTrial`
- Direct code reading: `src/modules/experiment/utils/constants.ts` — constant naming conventions, i18n wrapper pattern
- Direct code reading: `src/locales copy/fr/ns1.json` + `src/locales copy/en/ns1.json` — existing keys and structure
- `docs/EBDM_Task_Instructions_GSD.md` — Phase 6 flow description, researcher answers confirming 2 successes / 3 failures

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — REQ-008, REQ-009 specification
- `.planning/ROADMAP.md` — Phase 6 key files list, success criteria

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entire stack is established in codebase; no external library choices required
- Architecture: HIGH — plugin pattern is direct copy of CountdownTrialPlugin with state machine extension; loop pattern directly observed in practice.ts
- Pitfalls: HIGH — pitfalls derived from direct code inspection of existing plugins and observed patterns

**Research date:** 2026-04-07
**Valid until:** Stable until codebase refactoring — not time-sensitive (no external API dependencies)
