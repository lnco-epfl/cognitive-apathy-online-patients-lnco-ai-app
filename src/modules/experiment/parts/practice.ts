import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { JsPsych } from 'jspsych';
import { AudioNarration } from 'jspsych-audio-narration';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  holdKeyInstructionStimuli,
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
  PRACTICE_COUNTDOWN_MESSAGE,
  PRACTICE_TRIAL_MESSAGE,
  TAP_PROMPT_MESSAGE,
} from '../utils/constants';
import { Timeline, Trial, TrialTypes } from '../utils/types';
import {
  checkFlag,
  checkKeys,
  checkLastTrialSuccess,
  getHoldKeys,
  getTapKey,
} from '../utils/utils';

const holdKeyInstructionTrial = (
  state: ExperimentState,
  narration: AudioNarration,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: () => holdKeyInstructionStimuli(state),
  choices: [CONTINUE_BUTTON_MESSAGE()],
  on_load() {
    narration.play(
      `assets/audio/instruction-hold-key-${state.getPreferredHand() === 'left' ? 'l' : 'r'}.mp3`,
    );
  },
  on_finish() {
    narration.stop();
  },
});

/**
 * Hold-key practice block.
 * Participant holds the S key for ~5s, releases on prompt, gets feedback.
 * Loop exits after 2 successes OR 3 failures, whichever comes first.
 * "Entraînement réussi" end screen shown once after the loop.
 */
const holdKeyPracticeBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
  narration: AudioNarration,
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
            on_load() {
              narration.play(
                `assets/audio/hold-key-practice-${state.getPreferredHand() === 'left' ? 'l' : 'r'}.mp3`,
              );
            },
            on_finish() {
              narration.stop();
            },
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
        on_load() {
          if (failureCount >= HOLD_KEY_MAX_FAILURES) {
            narration.play(`assets/audio/hold-key-practice-done.mp3`);
          } else {
            narration.play('assets/audio/hold-key-practice-completed.mp3');
          }
        },
        on_finish() {
          narration.stop();
        },
      },
    ],
  };
};

/**
 *
 * @returns a set of instructions to step-by-step guide participants through the tapping task
 */
export const tappingInstructionsTimeline = (
  state: ExperimentState,
  narration: AudioNarration,
): Timeline =>
  // console.log(TAPPING_INSTRUCTIONS_PAGES(state.getKeySettings()));
  tappingInstructionPagesStimulus(state).map((_, index) => ({
    type: HtmlButtonResponsePlugin,
    stimulus() {
      return tappingInstructionPagesStimulus(state)[index];
    },
    choices: [CONTINUE_BUTTON_MESSAGE()],
    on_load() {
      narration.play(
        `assets/audio/instruction-tapping-${state.getPreferredHand() === 'left' ? 'l' : 'r'}.mp3`,
      );
    },
    on_finish() {
      narration.stop();
    },
  }));

/**
 *
 * @returns return an interactive countdown trial that showcases a keyboard waits, for the user to press the correct keys and then counts down for the trial to start
 */
export const interactiveCountdown = (
  state: ExperimentState,
  showFreezeFrame: boolean,
  narration: AudioNarration,
): Trial => ({
  type: CountdownTrialPlugin,
  initialText() {
    return PRACTICE_COUNTDOWN_MESSAGE(state.getKeySettings());
  },
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
  on_load() {
    narration.play(
      `assets/audio/tapping-practice-${state.getPreferredHand() === 'left' ? 'l' : 'r'}.mp3`,
    );
  },
  on_finish() {
    narration.stop();
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
  narration: AudioNarration,
  options: {
    startPromptMessage?: () => string;
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
      startPromptMessage: options.startPromptMessage,
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
      on_load() {
        narration.play(
          `assets/audio/tapping-tapping-practice-${state.getPreferredHand() === 'left' ? 'l' : 'r'}.mp3`,
        );
      },
      on_finish() {
        narration.stop();
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

const tappingPracticeBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
  narration: AudioNarration,
): Trial => {
  let successCount = 0;
  let failureCount = 0;

  return {
    timeline: [
      {
        timeline: [
          interactiveCountdown(state, false, narration),
          practiceTrial(jsPsych, state, device, false, narration, {
            startPromptMessage: () =>
              TAP_PROMPT_MESSAGE(state.getKeySettings()),
            continueTappingReminderMessage: CONTINUE_TAPPING_MESSAGE(),
            continueTappingReminderDelay: 700,
          }),
          successScreenFreezeFrame(jsPsych, false, state),
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
        on_load() {
          narration.play('assets/audio/hold-key-practice-completed.mp3');
        },
        on_finish() {
          narration.stop();
        },
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
  narration: AudioNarration,
): Trial => ({
  timeline: [
    {
      // The general timeline of the practice loop with the interactive timeline, the actual trial and then the loading bar
      timeline: [
        interactiveCountdown(state, showFreezeFrame, narration),
        practiceTrial(jsPsych, state, device, showFreezeFrame, narration),
        successScreenFreezeFrame(jsPsych, showFreezeFrame, state),
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
  narration: AudioNarration,
): Timeline => {
  const practiceBlock: Trial = {
    timeline: [
      holdKeyInstructionTrial(state, narration),
      holdKeyPracticeBlock(jsPsych, state, narration),
      tappingInstructionsTimeline(state, narration), // Only show the first instruction page before practice loops, the rest will be shown in the main task timeline
      tappingPracticeBlock(jsPsych, state, deviceInfo, narration),
    ],
  };

  return [practiceBlock];
};
