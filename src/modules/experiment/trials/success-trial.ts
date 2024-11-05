import { JsPsych, ParameterType } from 'jspsych';

import {
  SUCCESS_SCREEN_DURATION,
  TRIAL_FAILED,
  TRIAL_SUCCEEDED,
} from '../utils/constants';
import { TaskStagesType, Trial } from '../utils/types';
import { checkFlag } from '../utils/utils';

type SuccessTrialType = {
  trial_duration: number;
  task: string;
  success: boolean;
};

/**
 * @class SuccessScreenPlugin
 * @description A custom jsPsych plugin that displays a success or failure message based on the outcome of the previous trial.
 *
 * The trial includes:
 * - Displaying a large green "Success" message if the previous trial succeeded, or a large red "Failed" message if it did not.
 * - Monitoring the state of specified keys during the trial (to pass to releaseKeysStep)
 * - Automatically ending the trial after a specified duration.
 * - Collecting data about the keys' state and whether the trial was marked as successful.
 *
 * @param {Object} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @method trial - Executes the trial, handling UI setup, key event monitoring, and trial termination.
 *
 * Parameters:
 * - `trial_duration` (INT): The duration for which the success or failure message is displayed, in milliseconds.
 * - `task` (STRING): A label for the task being executed (default is "success").
 * - `success` (BOOL): A flag indicating whether the previous trial was successful (default is false).
 *
 * @method handleKeyUp - Handles the `keyup` event, updating the keys' state when they are released.
 * @method isSuccess - Determines whether the previous trial was successful by checking the trial data.
 * @method end_trial - Ends the trial, cleans up event listeners, and sends the recorded data (keys' state and success) to jsPsych.
 */
class SuccessScreenPlugin {
  static info = {
    name: 'success-screen-plugin',
    parameters: {
      trial_duration: {
        type: ParameterType.INT,
        default: SUCCESS_SCREEN_DURATION,
      },
      task: {
        type: ParameterType.STRING,
        default: 'success',
      },
      success: {
        type: ParameterType.BOOL,
        default: false,
      },
    },
  };

  jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element: HTMLElement, trial: SuccessTrialType): void {
    const endTrial = (): void => {
      const trialData = {
        task: 'success',
        success: trial.success,
      };
      this.jsPsych.finishTrial(trialData);
    };

    const stimulusHTML = trial.success
      ? `<p style="color: green; font-size: 48px;">${TRIAL_SUCCEEDED}</p>`
      : `<p style="color: red; font-size: 48px;">${TRIAL_FAILED}</p>`;

    // eslint-disable-next-line no-param-reassign
    display_element.innerHTML = stimulusHTML;

    this.jsPsych.pluginAPI.setTimeout(() => {
      endTrial();
    }, trial.trial_duration);
  }
}

export default SuccessScreenPlugin;

export const successScreen = (
  jsPsych: JsPsych,
  block: TaskStagesType,
): Trial => ({
  type: SuccessScreenPlugin,
  task: 'success',
  success() {
    // const previousTrial = jsPsych.data.get().last(2).first().values()[0];
    return checkFlag(block, 'success', jsPsych) /* previousTrial.success */;
  },
  trial_duration: SUCCESS_SCREEN_DURATION,
});
