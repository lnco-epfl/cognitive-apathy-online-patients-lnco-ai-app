# Hold Key Practice Trial — Research

**Researched:** 2026-04-07
**Domain:** jsPsych 7.x custom plugin, keyboard hold detection, practice trial loop
**Confidence:** HIGH (based on direct codebase inspection)

---

## Summary

The codebase already has a mature, well-tested pattern for "hold a key for N seconds" in `CountdownTrialPlugin`. That plugin does exactly what Phase 6 needs at its core: it tracks `keysState`, starts a countdown when all held keys are down, resets on early release, and ends the trial when the timer expires. The new hold-key practice trial is a lightweight variant of `CountdownTrialPlugin` with three differences:

1. After the hold completes it must **wait for key release** (not immediately end), then show "Très bien !" + checkmark.
2. On early release before the hold completes it must show a retry message and loop — which maps to the existing `loop_function` pattern used in `practiceLoop`.
3. The loop must run at least 2 times and allow at most 3 failures before continuing.

**Primary recommendation:** Create a new custom jsPsych plugin class `HoldKeyPracticePlugin` that mirrors `CountdownTrialPlugin`'s keydown/keyup/interval structure, adds a "release phase" state after the hold completes, and emits trial data (`success: boolean`, `earlyRelease: boolean`). Wrap it in a `loop_function` timeline in `practice.ts` using the same counter pattern already used by `practiceLoop`.

Do NOT reuse `CountdownTrialPlugin` directly — it calls `endTrial()` the moment the countdown expires, with no hook for "now wait for key release". Extending it would require patching `startCountdown` in a fragile way. A new plugin with ~120 lines of code is cleaner and follows the existing plugin pattern exactly.

---

## Recommended Approach

### Option A — Reuse CountdownTrialPlugin (REJECTED)

`CountdownTrialPlugin.startCountdown()` calls `endTrial()` unconditionally when `timeLeft <= 0`. There is no parameter or callback to insert a "release phase". Subclassing would require overriding a closure — not idiomatic. Rejected.

### Option B — HtmlKeyboardResponsePlugin + manual listeners (REJECTED)

`HtmlKeyboardResponsePlugin` is designed for single key-press responses, not hold-duration tracking. You would have to bolt on `keydown`/`keyup` listeners and a `setInterval` outside the plugin, which fights the plugin lifecycle. Rejected.

### Option C — New HoldKeyPracticePlugin class (RECOMMENDED)

Write a new plugin in `src/modules/experiment/trials/hold-key-practice-trial.ts` following the exact shape of `CountdownTrialPlugin`. Differences from `CountdownTrialPlugin`:

| Aspect | CountdownTrialPlugin | HoldKeyPracticePlugin |
|--------|---------------------|-----------------------|
| End of countdown | calls `endTrial()` | transitions to `phase = 'release'`, updates message to "Relâchez la touche" |
| Key-up during 'hold' phase | resets countdown | same — resets, sets `earlyRelease = true` |
| Key-up during 'release' phase | n/a | triggers success: shows "Très bien !" + checkmark, then calls `endTrial()` after brief delay |
| Trial data | `{ keyTappedEarlyFlag }` | `{ success, earlyRelease }` |
| `showFreezeFrame` | yes | not needed for this trial |

The loop logic (min 2 runs, max 3 failures) lives in `practice.ts`, not in the plugin.

---

## Code Pattern / Pseudocode

### Plugin file: `src/modules/experiment/trials/hold-key-practice-trial.ts`

```typescript
import { JsPsych, ParameterType } from 'jspsych';

export type HoldKeyPracticeType = {
  keyToHold: string;        // 's'
  holdDuration: number;     // 5000 ms
  promptMessage: string;    // "Allez-y! Maintenez la touche S enfoncée"
  releaseMessage: string;   // "Relâchez la touche"
  successMessage: string;   // "Très bien !"
  retryMessage: string;     // "Réessayez. Maintenez la touche plus longtemps."
};

export class HoldKeyPracticePlugin {
  static info = {
    name: 'hold-key-practice',
    version: '1.0',
    data: {
      task:       { type: ParameterType.STRING },
      success:    { type: ParameterType.BOOL },
      earlyRelease: { type: ParameterType.BOOL },
    },
    parameters: {
      keyToHold:      { type: ParameterType.STRING },
      holdDuration:   { type: ParameterType.INT, default: 5000 },
      promptMessage:  { type: ParameterType.HTML_STRING },
      releaseMessage: { type: ParameterType.HTML_STRING },
      successMessage: { type: ParameterType.HTML_STRING },
      retryMessage:   { type: ParameterType.HTML_STRING },
    },
  };

  jsPsych: JsPsych;
  constructor(jsPsych: JsPsych) { this.jsPsych = jsPsych; }

  trial(displayElement: HTMLElement, trial: HoldKeyPracticeType): void {
    // --- state ---
    type Phase = 'idle' | 'holding' | 'release' | 'success' | 'retry';
    let phase: Phase = 'idle';
    let holdInterval: number | null = null;
    let holdStart: number = 0;
    let earlyRelease = false;

    // --- DOM ---
    const messageEl = document.createElement('div');
    messageEl.id = 'hkp-message';
    messageEl.innerHTML = trial.promptMessage;
    displayElement.appendChild(messageEl);

    const timerEl = document.createElement('div');
    timerEl.id = 'hkp-timer';
    displayElement.appendChild(timerEl);

    // --- helpers ---
    const showMessage = (html: string): void => {
      messageEl.innerHTML = html;
      timerEl.innerHTML = '';
    };

    const showSuccess = (): void => {
      // Reuse the green checkmark pattern from CountdownTrialPlugin.showFreezeFrame()
      displayElement.innerHTML = `
        <div style="text-align:center; border: 5px solid #4CAF50; padding: 20px;
                    margin: 20px; background-color: white; border-radius: 12px;">
          <div style="display:inline-flex; align-items:center; justify-content:center;
                      width:60px; height:60px; border-radius:50%;
                      background-color:#4CAF50; color:white; font-size:32px; font-weight:bold;">
            ✓
          </div>
          <p style="text-align:center; font-size:18px; margin:0;">${trial.successMessage}</p>
        </div>`;
    };

    const endTrial = (success: boolean): void => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
      displayElement.innerHTML = '';
      this.jsPsych.finishTrial({ task: 'hold-key-practice', success, earlyRelease });
    };

    const startHoldInterval = (): void => {
      holdStart = performance.now();
      holdInterval = window.setInterval(() => {
        const elapsed = performance.now() - holdStart;
        const remaining = trial.holdDuration - elapsed;
        if (remaining <= 0) {
          clearInterval(holdInterval!);
          holdInterval = null;
          phase = 'release';
          showMessage(trial.releaseMessage);
        } else {
          // Optional: show countdown in timerEl
          timerEl.innerHTML = `<p style="text-align:center">${(remaining / 1000).toFixed(1)}s</p>`;
        }
      }, 100);
    };

    // --- event handlers ---
    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (key !== trial.keyToHold.toLowerCase()) return;
      if (phase === 'idle') {
        phase = 'holding';
        messageEl.innerHTML = ''; // hide prompt once they start holding
        startHoldInterval();
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (key !== trial.keyToHold.toLowerCase()) return;

      if (phase === 'holding') {
        // Early release — abort hold
        earlyRelease = true;
        if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
        phase = 'retry';
        showMessage(trial.retryMessage);
        // End trial immediately with failure so loop_function can decide to retry
        setTimeout(() => endTrial(false), 1500);

      } else if (phase === 'release') {
        // Correct: they waited for the hold to complete then released
        phase = 'success';
        showSuccess();
        setTimeout(() => endTrial(true), 2000);
      }
      // phases 'idle', 'success', 'retry' — ignore key-up
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
  }
}
```

### Timeline factory: add to `practice.ts`

```typescript
// Minimum 2 successful completions; bail out after 3 failures.
// Uses the existing counter pattern from practiceLoop / endOfPracticeRetryTrial.

const HOLD_KEY_MIN_SUCCESSES = 2;
const HOLD_KEY_MAX_FAILURES = 3;

export const holdKeyPracticeBlock = (jsPsych: JsPsych): Trial => {
  let successCount = 0;
  let failureCount = 0;

  return {
    timeline: [
      {
        type: HoldKeyPracticePlugin,
        keyToHold: 's',
        holdDuration: 5000,
        promptMessage: 'Allez-y ! Maintenez la touche <b>S</b> enfoncée',
        releaseMessage: 'Relâchez la touche',
        successMessage: 'Très bien !',
        retryMessage:
          'Vous avez relâché trop tôt. Réessayez — maintenez la touche jusqu'au signal.',
        on_finish(data: { success: boolean }) {
          if (data.success) {
            successCount += 1;
          } else {
            failureCount += 1;
          }
        },
      },
    ],
    loop_function(): boolean {
      if (failureCount >= HOLD_KEY_MAX_FAILURES) return false; // bail — too many failures
      if (successCount >= HOLD_KEY_MIN_SUCCESSES) return false; // done — enough successes
      return true; // keep looping
    },
  };
};
```

---

## Existing Files / Functions to Reuse

| Source | What to reuse |
|--------|---------------|
| `countdown-trial.ts` | Green checkmark HTML pattern (copy from `showFreezeFrame()` in `CountdownTrialPlugin`) |
| `countdown-trial.ts` | `setInterval` + `performance.now()` countdown pattern (identical idiom) |
| `countdown-trial.ts` | `document.addEventListener('keydown'/'keyup')` + cleanup in `endTrial` pattern |
| `success-trial.ts` | `SuccessScreenPlugin` — can be used as a *separate* trial after `HoldKeyPracticePlugin` if you prefer a clean handoff; but embedding the success state inside the plugin is simpler and self-contained |
| `practice.ts` | `loop_function` pattern from `practiceLoop` — same boolean return from jsPsych trial node |
| `utils/constants.ts` | Add constants: `HOLD_KEY_PRACTICE_DURATION`, `HOLD_KEY_MIN_SUCCESSES`, `HOLD_KEY_MAX_FAILURES`, `HOLD_KEY_RETRY_DISPLAY_TIME` |

The i18n strings ("Allez-y !", "Relâchez la touche", "Très bien !", retry message) should be added to `src/locales copy/fr/ns1.json` and `src/locales copy/en/ns1.json` following the existing key/value pattern, then referenced via `i18n.t(...)` inside constants functions rather than hardcoded in the plugin.

---

## Gotchas

### 1. `keydown` fires repeatedly while key is held (key repeat)
On all desktop OS, holding a key produces repeated `keydown` events after the initial press. The plugin guards against this with the `phase === 'idle'` check — only the first `keydown` transitions to `'holding'`. However, you must also ensure the browser's key-repeat rate does not accidentally re-trigger anything. The guard `if (phase === 'idle')` in `handleKeyDown` is sufficient.

### 2. `event.repeat` can be used as an explicit guard
`KeyboardEvent.repeat` is `true` on auto-repeat events. Adding `if (event.repeat) return;` inside `handleKeyDown` is belt-and-suspenders protection alongside the phase check.

### 3. Key hold state is not preserved across jsPsych trials by default
If the participant is already holding S when the trial starts (e.g., from a previous trial), the `keydown` event has already fired and will not fire again until they release and re-press. Initialize `phase = 'idle'` and do NOT pre-seed `keysState` as `true` (unlike `TappingTask` which initialises `keysState[key] = true` — that approach is wrong for this use case because it assumes keys are held from before the trial starts).

### 4. `REHOLD_TIMEOUT` pattern is NOT appropriate here
`CountdownTrialPlugin` gives a 500 ms grace period (`REHOLD_TIMEOUT`) on early release so participants can briefly re-hold without resetting. For Phase 6 the requirement is that any release before the hold completes counts as a failure (with retry). Do not adopt the rehold grace timeout.

### 5. Loop counter scope
The `successCount` and `failureCount` variables in `holdKeyPracticeBlock` must be declared **outside** the `timeline` array and **inside** the factory function so they persist across loop iterations. This matches how `numberOfPracticeLoopsCompleted` works in `ExperimentState` — it lives outside the trial. If you need the counts in jsPsych data for analysis, also write them in `on_finish`.

### 6. Cleanup on jsPsych abort / navigation
jsPsych may call `finishTrial` from outside (e.g., if the experiment is cut short). The `endTrial` helper removes both listeners and clears the interval, which is correct. Do NOT use `this.jsPsych.pluginAPI.setTimeout` for the post-success delay — use plain `window.setTimeout` as seen in `TappingTask`, and clear it in `endTrial` if needed.

### 7. French string encoding
The retry message contains a right single quote in "jusqu'au". Store the string in the JSON locale file, not inline in TypeScript, to avoid encoding issues in the build toolchain.

---

## File Locations for New Code

```
src/modules/experiment/
├── trials/
│   └── hold-key-practice-trial.ts       ← NEW plugin class + type
└── parts/
    └── practice.ts                       ← ADD holdKeyPracticeBlock() + import

src/locales copy/
├── fr/ns1.json                           ← ADD translation keys
└── en/ns1.json                           ← ADD translation keys

src/modules/experiment/utils/
└── constants.ts                          ← ADD HOLD_KEY_PRACTICE_DURATION etc.
```

---

## Sources

All findings are based on direct inspection of the existing codebase files at the paths above (HIGH confidence). No external library research was required — the implementation follows the established plugin pattern in this repository verbatim.
