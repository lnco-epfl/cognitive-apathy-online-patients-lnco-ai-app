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
 *   holding -> feedback:failure (on holdKey keyup before holdDuration)
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
    let trialEnded = false;

    const FEEDBACK_DURATION = 1500;

    const endTrial = (success: boolean): void => {
      if (trialEnded) return;
      trialEnded = true;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
        feedbackTimer = null;
      }
      // eslint-disable-next-line no-param-reassign
      displayElement.innerHTML = '';
      this.jsPsych.finishTrial({ task: 'hold-key-practice', success });
    };

    const showFeedback = (success: boolean): void => {
      currentPhase = 'feedback';
      if (success) {
        // eslint-disable-next-line no-param-reassign
        displayElement.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <div style="
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 80px;
              height: 80px;
              margin-bottom: 20px;
              border-radius: 50%;
              background-color: #4CAF50;
              color: white;
              font-size: 40px;
              font-weight: bold;
            ">✓</div>
            <p style="font-size: 24px; color: #4CAF50; font-weight: bold;">
              ${HOLD_S_SUCCESS_MESSAGE()}
            </p>
          </div>`;
      } else {
        // eslint-disable-next-line no-param-reassign
        displayElement.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <p style="font-size: 22px;">
              ${HOLD_S_RETRY_MESSAGE(trial.holdKey)}
            </p>
          </div>`;
      }
      feedbackTimer = window.setTimeout(() => {
        endTrial(success);
      }, FEEDBACK_DURATION);
    };

    const showReleasePrompt = (): void => {
      currentPhase = 'release_prompt';
      // eslint-disable-next-line no-param-reassign
      displayElement.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <p style="font-size: 28px; font-weight: bold; color: #1976D2;">
            ${HOLD_S_RELEASE_PROMPT(trial.holdKey)}
          </p>
        </div>`;
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (trialEnded) return;
      const key = event.key.toLowerCase();
      if (key === trial.holdKey.toLowerCase() && currentPhase === 'idle') {
        currentPhase = 'holding';
        holdTimer = window.setTimeout(() => {
          holdTimer = null;
          showReleasePrompt();
        }, trial.holdDuration * 1000);
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (trialEnded) return;
      const key = event.key.toLowerCase();
      if (key !== trial.holdKey.toLowerCase()) return;

      if (currentPhase === 'holding') {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        showFeedback(false);
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
        <p style="font-size: 22px;">
          ${HOLD_S_PROMPT_MESSAGE(trial.holdKey)}
        </p>
      </div>`;
  }
}
