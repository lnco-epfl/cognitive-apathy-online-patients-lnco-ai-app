import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { handTutorial, noStimuliVideo } from '../jspsych/stimulus';
import { CountdownTrialPlugin } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import TappingTask from '../trials/tapping-task-trial';
import {
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
  INTERACTIVE_KEYBOARD_TUTORIAL_MESSAGE,
  MINIMUM_CALIBRATION_MEDIAN,
  PROGRESS_BAR,
} from '../utils/constants';
import { OtherTaskStagesType, Timeline, Trial } from '../utils/types';
import {
  changeProgressBar,
  checkFlag,
  checkKeys,
  checkTaps,
} from '../utils/utils';

/**
 *
 * @returns  Directional trial that contains the image to show users finger placement
 */
export const handTutorialTrial = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [handTutorial],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
});

/**
 *
 * @param jsPsych current experiment
 * @returns returns a video trail showcasing the pressing of the keyboard required for the task
 */
export const noStimuliVideoTutorialTrial = (jsPsych: JsPsych): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [noStimuliVideo],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
  choices: [CONTINUE_BUTTON_MESSAGE],
  on_finish() {
    // Clear the display element
    // eslint-disable-next-line no-param-reassign
    jsPsych.getDisplayElement().innerHTML = '';
    // Change progress bar
    changeProgressBar(PROGRESS_BAR.PROGRESS_BAR_PRACTICE, 0.07, jsPsych);
  },
});

/**
 *
 * @returns return an interactive countdown trial that showcases a keyboard waits, for the user to press the correct keys and then counts down for the trial to start
 */
export const interactiveCountdown = (): Trial => ({
  type: CountdownTrialPlugin,
  message: INTERACTIVE_KEYBOARD_TUTORIAL_MESSAGE,
  showKeyboard: true,
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
export const practiceTrial = (jsPsych: JsPsych): Trial => ({
  timeline: [
    {
      type: TappingTask,
      showThermometer: false,
      task: 'practice',

      // This code adds the key tapped early flag to the actual task in case it was tapped too early during countdown
      on_start(trial: Trial) {
        const keyTappedEarlyFlag = checkFlag(
          OtherTaskStagesType.Countdown,
          'keyTappedEarlyFlag',
          jsPsych,
        );
        // eslint-disable-next-line no-param-reassign
        trial.keyTappedEarlyFlag = keyTappedEarlyFlag;
      },
    },
    {
      timeline: [releaseKeysStep()],
      conditional_function() {
        return checkKeys(OtherTaskStagesType.Practice, jsPsych);
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
): Trial => ({
  timeline: [
    {
      // The general timeline of the practice loop with the interactive timeline, the actual trial and then the loading bar
      timeline: [
        interactiveCountdown(),
        practiceTrial(jsPsych),
        loadingBarTrial(true, jsPsych),
      ],
      // Repeat if the keys were released early, if user tapped before go, or didn't hit minimum required taps
      loop_function() {
        const keyTappedEarlyFlag = checkFlag(
          OtherTaskStagesType.Countdown,
          'keyTappedEarlyFlag',
          jsPsych,
        );
        const keysReleasedFlag = checkFlag(
          OtherTaskStagesType.Practice,
          'keysReleasedFlag',
          jsPsych,
        );
        const numberOfTaps = checkTaps(OtherTaskStagesType.Practice, jsPsych);
        return (
          keysReleasedFlag ||
          keyTappedEarlyFlag ||
          numberOfTaps < MINIMUM_CALIBRATION_MEDIAN
        );
      },
    },
  ],
  on_timeline_finish() {
    state.incrementNumberPracticeLoopsCompleted();
    const progressBarProgress = jsPsych.progressBar!.progress;
    if (state.getState().numberOfPracticeLoopsCompleted === 4) {
      changeProgressBar(PROGRESS_BAR.PROGRESS_BAR_CALIBRATION, 0, jsPsych);
    } else {
      changeProgressBar(
        PROGRESS_BAR.PROGRESS_BAR_PRACTICE,
        progressBarProgress + 0.25,
        jsPsych,
      );
    }
  },
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
): Timeline => {
  const practiceTimeline: Timeline = [];

  practiceTimeline.push(noStimuliVideoTutorialTrial(jsPsych));
  practiceTimeline.push(handTutorialTrial());
  for (
    let i = 0;
    i < state.getPracticeSettings().numberOfPracticeLoops;
    i += 1
  ) {
    practiceTimeline.push(practiceLoop(jsPsych, state));
  }
  return practiceTimeline;
};
