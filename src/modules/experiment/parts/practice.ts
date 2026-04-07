import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  sKeyInstructionStimuli,
  tappingInstructionPagesStimulus,
} from '../jspsych/stimulus';
import { CountdownTrialPlugin } from '../trials/countdown-trial';
import { HoldKeyPracticePlugin } from '../trials/hold-key-practice-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import { successScreenFreezeFrame } from '../trials/success-trial';
import TappingTask from '../trials/tapping-task-trial';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  CONTINUE_BUTTON_MESSAGE,
  CONTINUE_TAPPING_MESSAGE,
  HOLD_KEY_MAX_FAILURES,
  HOLD_KEY_MIN_SUCCESSES,
  HOLD_KEY_PRACTICE_DURATION,
  HOLD_S_PRACTICE_COMPLETE_MESSAGE,
  HOLD_S_PRACTICE_CONTINUE_MESSAGE,
  MAX_PRACTICE_LOOP_RETRIES,
  PRACTICE_ENDING_MESSAGE_NO_RETRY,
  PRACTICE_ENDING_MESSAGE_RETRY,
  PRACTICE_ENDING_TITLE,
  PRACTICE_TRIAL_MESSAGE,
  REPEAT_PRACTICE_BUTTON,
} from '../utils/constants';
import { Timeline, Trial, TrialTypes } from '../utils/types';
import {
  checkFlag,
  checkKeys,
  checkLastTrialSuccess,
  getHoldKeys,
  getTapKey,
} from '../utils/utils';

const sKeyInstructionTrial = (state: ExperimentState): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: () => sKeyInstructionStimuli(state),
  choices: [CONTINUE_BUTTON_MESSAGE()],
});

/**
 * Phase 6: Hold-key practice block.
 * Participant holds the S key for ~5s, releases on prompt, gets feedback.
 * Loop exits after 2 successes OR 3 failures, whichever comes first.
 * "Entraînement réussi" end screen shown once after the loop.
 */
const holdKeyPracticeBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
): Trial => {
  let successCount = 0;
  let failureCount = 0;

  return {
    timeline: [
      {
        timeline: [
          {
            type: HoldKeyPracticePlugin,
            holdKey() {
              return getHoldKeys(state)[0];
            },
            holdDuration: HOLD_KEY_PRACTICE_DURATION,
          },
        ],
        loop_function() {
          const last = jsPsych.data.get().last(1).values()[0] as
            | Record<string, unknown>
            | undefined;
          if (last?.task === 'hold-key-practice') {
            if (last.success === true) successCount += 1;
            else failureCount += 1;
          }
          return (
            successCount < HOLD_KEY_MIN_SUCCESSES &&
            failureCount < HOLD_KEY_MAX_FAILURES
          );
        },
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: () =>
          failureCount >= HOLD_KEY_MAX_FAILURES
            ? HOLD_S_PRACTICE_CONTINUE_MESSAGE()
            : HOLD_S_PRACTICE_COMPLETE_MESSAGE(),
        choices: [CONTINUE_BUTTON_MESSAGE()],
      },
    ],
  };
};

/**
 *
 * @returns a set of instructions to step-by-step guide participants through the tapping task
 */
export const tappingInstructionsTimeline = (state: ExperimentState): Timeline =>
  // console.log(TAPPING_INSTRUCTIONS_PAGES(state.getKeySettings()));
  tappingInstructionPagesStimulus(state).map((_, index) => ({
    type: HtmlButtonResponsePlugin,
    stimulus() {
      return tappingInstructionPagesStimulus(state)[index];
    },
    choices: [CONTINUE_BUTTON_MESSAGE()],
  }));

/**
 *
 * @returns a trial that allows the user to either continue to the main task or repeat the practice trials
 */
export const endOfPracticeRetryTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: () => {
    const retries = state.getState().numberOfPracticeLoopsCompleted;
    if (retries >= MAX_PRACTICE_LOOP_RETRIES) {
      return `<h2 style="text-align: center;">${PRACTICE_ENDING_TITLE()}</h2>
              <p style="text-align: center;">${PRACTICE_ENDING_MESSAGE_NO_RETRY()}</p>`;
    }
    return `<h2 style="text-align: center;">${PRACTICE_ENDING_TITLE()}</h2>
            <p style="text-align: center;">${PRACTICE_ENDING_MESSAGE_RETRY()}</p>`;
  },
  choices: () => {
    const retries = state.getState().numberOfPracticeLoopsCompleted;
    if (retries >= MAX_PRACTICE_LOOP_RETRIES) {
      return [CONTINUE_BUTTON_MESSAGE()];
    }
    return [REPEAT_PRACTICE_BUTTON(), CONTINUE_BUTTON_MESSAGE()];
  },
  on_finish(data: { response: number }) {
    if (data.response === 0) {
      state.incrementNumberPracticeLoopsCompleted();
    }
  },
});

/**
 *
 * @returns return an interactive countdown trial that showcases a keyboard waits, for the user to press the correct keys and then counts down for the trial to start
 */
export const interactiveCountdown = (
  state: ExperimentState,
  showFreezeFrame: boolean,
): Trial => ({
  type: CountdownTrialPlugin,
  message() {
    return PRACTICE_TRIAL_MESSAGE(state.getKeySettings());
  },
  keysToHold() {
    return getHoldKeys(state);
  },
  keyToPress() {
    return getTapKey(state);
  },
  showKeyboard: false,
  showFreezeFrame,
  usePhotoDiode: state.getPhotoDiodeSettings().usePhotoDiode,
  data: {
    task: 'countdown',
  },
});

/**
 * @function practiceTrial
 * @description Creates a practice trial timeline in which participants practice holding keys and tapping a key to increase a virtual mercury level.
 *
 * This trial includes:
 * - A task plugin where participants practice without visual feedback from the thermometer.
 * - Monitoring the state of key presses to detect early key taps before the "go" signal.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @returns {Object} - A jsPsych trial object containing the practice task and a conditional release keys step.
 */
export const practiceTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
  showFreezeFrame: boolean,
  options: {
    continueTappingReminderMessage?: string;
    continueTappingReminderDelay?: number;
  } = {},
): Trial => ({
  timeline: [
    {
      type: TappingTask,
      keysToHold() {
        return getHoldKeys(state);
      },
      keyToPress() {
        return getTapKey(state);
      },
      showFreezeFrame,
      showThermometer: false,
      task: 'practice',
      usePhotoDiode: state.getPhotoDiodeSettings().usePhotoDiode,
      continueTappingReminderMessage: options.continueTappingReminderMessage,
      continueTappingReminderDelay: options.continueTappingReminderDelay,
      on_start(trial: Trial) {
        if (device.device) {
          sendSerialTrigger(device, {
            outsideTask: true,
            decisionTrigger: false,
            isEnd: false,
          });
        }
        sendPhotoDiodeTrigger(
          state.getPhotoDiodeSettings().usePhotoDiode,
          false,
        );
        // This code adds the key tapped early flag to the actual task in case it was tapped too early during countdown
        const keyTappedEarlyFlag = checkFlag(
          TrialTypes.CountdownTask,
          'keyTappedEarlyFlag',
          jsPsych,
        );
        // eslint-disable-next-line no-param-reassign
        trial.keyTappedEarlyFlag = keyTappedEarlyFlag;
      },
      on_finish() {
        if (device.device) {
          sendSerialTrigger(device, {
            outsideTask: true,
            decisionTrigger: false,
            isEnd: true,
          });
        }
        sendPhotoDiodeTrigger(
          state.getPhotoDiodeSettings().usePhotoDiode,
          true,
        );
      },
    },
    {
      timeline: [releaseKeysStep(state)],
      conditional_function() {
        return checkKeys(jsPsych);
      },
    },
  ],
});

const phase8PracticeBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
): Trial => {
  let successCount = 0;
  let failureCount = 0;

  return {
    timeline: [
      {
        timeline: [
          interactiveCountdown(state, false),
          practiceTrial(jsPsych, state, device, false, {
            continueTappingReminderMessage: CONTINUE_TAPPING_MESSAGE(),
            continueTappingReminderDelay: 1200,
          }),
          successScreenFreezeFrame(jsPsych, false, state.getKeySettings()),
          loadingBarTrial(true, jsPsych),
        ],
        loop_function() {
          if (checkLastTrialSuccess(jsPsych)) {
            successCount += 1;
          } else {
            failureCount += 1;
          }

          return (
            successCount < HOLD_KEY_MIN_SUCCESSES &&
            failureCount < HOLD_KEY_MAX_FAILURES
          );
        },
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: () => HOLD_S_PRACTICE_COMPLETE_MESSAGE(),
        choices: [CONTINUE_BUTTON_MESSAGE()],
      },
    ],
  };
};

/**
 * @function practiceLoop
 * @description Creates a loop of practice trials where participants must repeatedly complete practice tasks until they meet the required criteria.
 *
 * This loop includes:
 * - A countdown step to prepare participants for the practice task with a keyboard showing their key presses.
 * - A practice trial where participants practice key holding and tapping.
 * - A loading bar trial to give participants a break between practice trials.
 * - A loop function that repeats the practice trials if the keys were released early, the key was tapped early, or the participant did not meet the minimum tap count.
 * - An update to the progress bar based on the number of practice loops completed successfully based on the criteria above, resetting it after four loops.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {State} state - An object for storing and tracking state data during the trials, such as the number of practice loops completed.
 *
 * @returns {Object} - A jsPsych trial object that loops the practice task until the participant meets the required criteria.
 */
export const practiceLoop = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
  showFreezeFrame: boolean,
): Trial => ({
  timeline: [
    {
      // The general timeline of the practice loop with the interactive timeline, the actual trial and then the loading bar
      timeline: [
        interactiveCountdown(state, showFreezeFrame),
        practiceTrial(jsPsych, state, device, showFreezeFrame),
        successScreenFreezeFrame(
          jsPsych,
          showFreezeFrame,
          state.getKeySettings(),
        ),
        loadingBarTrial(true, jsPsych),
      ],
      // Repeat if the keys were released early, if user tapped before go, or didn't hit minimum required taps
      loop_function() {
        return !checkLastTrialSuccess(jsPsych);
      },
    },
  ],
});

/**
 * Function that builds the practice loops of the experiment that allow the user to get familiar with the experiment
 * @param jsPsych containing the current experiment variable
 * @param state containing the state of this experiment, including a setting that determines the number of practice loops
 * @returns return a set of trials that will guide the user through the initial practice sets
 */
export const buildPracticeTrials = (
  jsPsych: JsPsych,
  state: ExperimentState,
  deviceInfo: DeviceType,
): Timeline => {
  const practiceBlock: Trial = {
    timeline: [
      sKeyInstructionTrial(state),
      holdKeyPracticeBlock(jsPsych, state),
      tappingInstructionsTimeline(state),
      phase8PracticeBlock(jsPsych, state, deviceInfo),
      endOfPracticeRetryTrial(jsPsych, state),
    ],
    loop_function: () => {
      // Did the participant choose "Repeat Practice"?
      const lastTrial = jsPsych.data.get().last(1).values()[0];
      const choseRepeat = lastTrial?.response === 0;

      // How many times have they repeated?
      const repeats = state.getState().numberOfPracticeLoopsCompleted;

      if (choseRepeat && repeats <= MAX_PRACTICE_LOOP_RETRIES) {
        return true; // redo practice
      }
      return false; // move on to main task
    },
  };

  return [practiceBlock];
};
