import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  sKeyInstructionStimuli,
  tappingInstructionPagesStimulus,
} from '../jspsych/stimulus';
import { CountdownTrialPlugin } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import { successScreenFreezeFrame } from '../trials/success-trial';
import TappingTask from '../trials/tapping-task-trial';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  CONTINUE_BUTTON_MESSAGE,
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
      tappingInstructionsTimeline(state),
      practiceLoop(jsPsych, state, deviceInfo, true),
      ...Array.from(
        { length: state.getPracticeSettings().numberOfPracticeLoops - 1 },
        () => practiceLoop(jsPsych, state, deviceInfo, false),
      ),
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
