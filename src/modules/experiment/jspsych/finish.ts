import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import {
  END_EXPERIMENT_MESSAGE,
  EXPERIMENT_HAS_ENDED_MESSAGE,
  FAILED_VALIDATION_MESSAGE,
  FINISH_BUTTON_MESSAGE,
} from '../utils/constants';
import { Trial } from '../utils/types';
import {
  calculateTotalReward,
  saveDataToLocalStorage,
  showEndScreen,
} from '../utils/utils';

/**
 * @function finishExperiment
 * @description Creates a jsPsych trial that allows the participant to finish the experiment, displaying a final message and saving the experiment data.
 *
 * This function includes:
 * - Displaying a message informing the participant that the experiment has ended.
 * - Providing a button for the participant to confirm the end of the experiment.
 * - Saving the experiment data to local storage (in case of any errors)
 * - Calculating the total reward and including it in the trial data for easy access.
 * - Showing a final end screen message after the experiment ends.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @returns {Object} - A jsPsych trial object that finalizes the experiment and handles the necessary data saving and display logic.
 */

export const finishExperiment = (
  jsPsych: JsPsych,
  updateData: (data: DataCollection) => void,
): Trial => ({
  type: htmlButtonResponse,
  choices: [FINISH_BUTTON_MESSAGE],
  stimulus() {
    saveDataToLocalStorage(jsPsych);
    return `<p>${END_EXPERIMENT_MESSAGE}</p>`;
  },
  data: {
    task: 'finish_experiment',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on_finish(data: any) {
    const totalSuccessfulReward = calculateTotalReward(jsPsych);
    // eslint-disable-next-line no-param-reassign
    data.totalReward = totalSuccessfulReward;
    const resultData = jsPsych.data.get();
    updateData(resultData);
    showEndScreen(EXPERIMENT_HAS_ENDED_MESSAGE);
  },
});

/**
 * @function finishExperimentEarly
 * @description Aborts the experiment early, saving the data and showing an end screen with a message.
 *
 * This function includes:
 * - Saving the current experiment data to local storage.
 * - Aborting the experiment using jsPsych's `abortExperiment` method.
 * - Showing a final end screen message after the experiment is aborted.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 */

// This is used in the calibration section section and should eventually be merged with the "finishExperimentEarlyTrial" below

export const finishExperimentEarly = (
  jsPsych: JsPsych,
  onFinish: (data: DataCollection) => void,
): void => {
  jsPsych.abortExperiment(FAILED_VALIDATION_MESSAGE);
  const resultData = jsPsych.data.get();
  onFinish(resultData);
  showEndScreen(EXPERIMENT_HAS_ENDED_MESSAGE);
};

/**
 * @function finishExperimentEarlyTrial
 * @description Creates a jsPsych trial that allows the participant to finish the experiment early, displaying a message and saving the experiment data.
 *
 * This function includes:
 * - Displaying a message informing the participant that the experiment is being ended early due to failed validation.
 * - Providing a button for the participant to confirm the early termination of the experiment.
 * - Saving the experiment data to local storage.
 * - Showing a final end screen message after the experiment is aborted.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @returns {Object} - A jsPsych trial object that handles the early termination of the experiment and performs the necessary data saving and display logic.
 */

export const finishExperimentEarlyTrial = (
  jsPsych: JsPsych,
  updateData: (data: DataCollection) => void,
): Trial => ({
  type: htmlButtonResponse,
  choices: [FINISH_BUTTON_MESSAGE],
  stimulus: FAILED_VALIDATION_MESSAGE,
  data: {
    task: 'finish_experiment',
  },
  on_finish() {
    finishExperimentEarly(jsPsych, updateData);
  },
});
