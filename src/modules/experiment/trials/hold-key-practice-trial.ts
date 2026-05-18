// eslint-disable-next-line import/no-extraneous-dependencies
import { JsPsych, ParameterType } from 'jspsych';

import {
  HOLD_KEY_PRACTICE_DURATION,
  HOLD_S_PROMPT_MESSAGE,
  HOLD_S_RELEASE_PROMPT,
  HOLD_S_RETRY_MESSAGE,
  HOLD_S_SUCCESS_MESSAGE,
} from '../utils/constants';

export type HoldKeyPracticeTrialType = {
  holdKey: string;
  holdDuration: number;
};

/**
 * @class HoldKeyPracticePlugin
 * @description Phase 6 practice trial: participant holds the S key for ~5 seconds,
 * sees a release prompt, releases, and gets success/retry feedback.
 *
 * State machine:
 *   idle -> holding (on holdKey keydown)
 *   holding -> release_prompt (after holdDuration seconds)
 *   holding -> [grace 300ms] -> feedback:failure (keyup held > 300ms)
 *   holding -> holding (keyup then keydown within 300ms grace window)
 *   release_prompt -> feedback:success (on holdKey keyup)
 *   feedback -> endTrial (after 1500ms)
 *
 * Outputs: { task: 'hold-key-practice', success: boolean }
 */
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
      holdDuration: {
        type: ParameterType.INT,
        default: HOLD_KEY_PRACTICE_DURATION,
      },
    },
  };

  jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement, trial: HoldKeyPracticeTrialType): void {
    type Phase = 'idle' | 'holding' | 'release_prompt' | 'feedback';
    let currentPhase: Phase = 'idle';
    let holdTimer: number | null = null;
    let feedbackTimer: number | null = null;
    let twitchGraceTimer: number | null = null;
    let progressInterval: number | null = null;
    let trialEnded = false;
    let holdStartTime = 0;

    const SUCCESS_FEEDBACK_DURATION = 1500;
    const FAILURE_FEEDBACK_DURATION = 3000;
    const TWITCH_GRACE_MS = 300;

    const endTrial = (success: boolean): void => {
      if (trialEnded) return;
      trialEnded = true;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      document.removeEventListener('keydown', handleKeyDown);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      document.removeEventListener('keyup', handleKeyUp);
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
        feedbackTimer = null;
      }
      if (twitchGraceTimer) {
        clearTimeout(twitchGraceTimer);
        twitchGraceTimer = null;
      }
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      // eslint-disable-next-line no-param-reassign
      displayElement.innerHTML = '';
      this.jsPsych.finishTrial({ task: 'hold-key-practice', success });
    };

    const showFeedback = (success: boolean): void => {
      currentPhase = 'feedback';
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }

      if (success) {
        // eslint-disable-next-line no-param-reassign
        displayElement.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <div class="trial-icon-lg" style="
              display: inline-flex; align-items: center; justify-content: center;
              width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%;
              background-color: #4CAF50; color: white; font-weight: bold;
            ">✓</div>
            <p style="color: #4CAF50; font-weight: bold;">
              ${HOLD_S_SUCCESS_MESSAGE()}
            </p>
          </div>`;
        feedbackTimer = window.setTimeout(
          () => endTrial(true),
          SUCCESS_FEEDBACK_DURATION,
        );
      } else {
        // eslint-disable-next-line no-param-reassign
        displayElement.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <div style="
              display: inline-block; border: 3px solid #E65100; border-radius: 12px;
              background-color: #FFF3E0; padding: 24px 32px; max-width: 480px;
            ">
              <p class="fs-result" style="margin: 0 0 12px 0;">⚠️</p>
              <p style="color: #E65100; font-weight: bold; margin: 0;">
                ${HOLD_S_RETRY_MESSAGE(trial.holdKey)}
              </p>
            </div>
          </div>`;
        feedbackTimer = window.setTimeout(
          () => endTrial(false),
          FAILURE_FEEDBACK_DURATION,
        );
      }
    };

    const showReleasePrompt = (): void => {
      currentPhase = 'release_prompt';
      if (twitchGraceTimer) {
        clearTimeout(twitchGraceTimer);
        twitchGraceTimer = null;
      }
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      // eslint-disable-next-line no-param-reassign
      displayElement.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <p style="font-weight: bold; color: #1976D2;">
            ${HOLD_S_RELEASE_PROMPT(trial.holdKey)}
          </p>
        </div>`;
    };

    const startProgressIndicator = (): void => {
      const totalMs = trial.holdDuration * 1000;
      const updateProgress = (): void => {
        if (trialEnded || currentPhase !== 'holding') return;
        const elapsed = Date.now() - holdStartTime;
        const pct = Math.min((elapsed / totalMs) * 100, 100);
        // eslint-disable-next-line no-param-reassign
        displayElement.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <p style="margin-bottom: 24px;">
              ${HOLD_S_PROMPT_MESSAGE(trial.holdKey)}
            </p>
            <div style="
              width: 320px; height: 20px; background-color: #e0e0e0;
              border-radius: 10px; margin: 0 auto; overflow: hidden;
            ">
              <div style="
                width: ${pct}%; height: 100%; background-color: #1976D2;
                border-radius: 10px; transition: width 0.1s linear;
              "></div>
            </div>
          </div>`;
      };
      updateProgress();
      progressInterval = window.setInterval(updateProgress, 80);
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (trialEnded) return;
      const key = event.key.toLowerCase();
      if (key !== trial.holdKey.toLowerCase()) return;

      if (twitchGraceTimer !== null) {
        // Key returned within grace window — cancel failure and resume
        clearTimeout(twitchGraceTimer);
        twitchGraceTimer = null;
        return;
      }

      if (currentPhase === 'idle') {
        currentPhase = 'holding';
        holdStartTime = Date.now();
        holdTimer = window.setTimeout(() => {
          holdTimer = null;
          showReleasePrompt();
        }, trial.holdDuration * 1000);
        startProgressIndicator();
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (trialEnded) return;
      const key = event.key.toLowerCase();
      if (key !== trial.holdKey.toLowerCase()) return;

      if (currentPhase === 'holding') {
        // Allow brief releases (twitches) before marking as failure
        twitchGraceTimer = window.setTimeout(() => {
          twitchGraceTimer = null;
          if (currentPhase === 'holding') {
            if (holdTimer) {
              clearTimeout(holdTimer);
              holdTimer = null;
            }
            showFeedback(false);
          }
        }, TWITCH_GRACE_MS);
      } else if (currentPhase === 'release_prompt') {
        showFeedback(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Show initial prompt
    // eslint-disable-next-line no-param-reassign
    displayElement.innerHTML = `
      <div style="text-align:center; padding: 40px;">
        <p>
          ${HOLD_S_PROMPT_MESSAGE(trial.holdKey)}
        </p>
      </div>`;
  }
}
