import { JsPsych, ParameterType } from 'jspsych';

import { KeySettings } from '@/modules/context/SettingsContext';

import {
  KEY_RELEASED_EARLY_FIRST_ERROR_MESSAGE,
  KEY_TAPPED_EARLY_FIRST_ERROR_MESSAGE,
  NOT_ENOUGH_TAPS_FIRST_ERROR_MESSAGE,
  SUCCESSFUL_FIRST_TRIAL_MESSAGE,
  SUCCESS_SCREEN_DURATION,
  SUCCESS_SCREEN_DURATION_FREEZE_FRAME,
  TRIAL_FAILED,
  TRIAL_SUCCEEDED,
} from '../utils/constants';
import { MINIMUM_CALIBRATION_MEDIAN } from '../utils/constants_old';
import { Trial, TrialTypes } from '../utils/types';
import { checkFlag, checkLastTrialSuccess, checkTaps } from '../utils/utils';

type SuccessTrialType = {
  trial_duration: number;
  task: string;
  success: boolean;
  showFreezeFrame: boolean;
  reasonMessage: string | null;
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
      reasonMessage: {
        type: ParameterType.STRING,
        default: null,
      },
      showFreezeFrame: {
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
    let stimulusHTML = '';
    if (trial.showFreezeFrame && trial.reasonMessage) {
      if (trial.success) {
        stimulusHTML = `
          <div style="text-align:center; border: 5px solid #4CAF50; padding: 20px; margin: 20px; background-color: white; position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); z-index: 10; max-width: 600px; border-radius: 12px;">
          <!-- Success circle with checkmark -->
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
            border-radius: 50%;
            background-color: #4CAF50;
            color: white;
            font-size: 32px;
            font-weight: bold;
          ">
            ✓
          </div>
          <p style="text-align:center; font-size: 18px; margin: 0;">
            ${trial.reasonMessage}
          </p>
        </div>`;
      } else {
        // Show Warning Message (yellow triangle with exclamation mark)
        stimulusHTML = `
          <div style="text-align:center; border: 5px solid #FFC107; padding: 20px; margin: 20px; background-color: white; position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); z-index: 10; max-width: 600px; border-radius: 12px;">
          <!-- Warning triangle with exclamation mark -->
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
            border-radius: 50%;
            background-color: #FFC107;
            color: white;
            font-size: 32px;
            font-weight: bold;
          ">
            !
          </div>
          <p style="text-align:center; font-size: 18px; margin: 0;">
            ${trial.reasonMessage}
          </p>
        </div>`;
      }
    } else {
      stimulusHTML = trial.success
        ? `<p style="color: green; font-size: 48px;">${TRIAL_SUCCEEDED()}</p>`
        : `<p style="color: red; font-size: 48px;">${TRIAL_FAILED()}</p>`;
    }
    // eslint-disable-next-line no-param-reassign
    display_element.innerHTML = stimulusHTML;

    this.jsPsych.pluginAPI.setTimeout(() => {
      endTrial();
    }, trial.trial_duration);
  }
}

export default SuccessScreenPlugin;

export const successScreen = (jsPsych: JsPsych): Trial => ({
  type: SuccessScreenPlugin,
  task: 'success',
  success() {
    return checkFlag(TrialTypes.TappingTask, 'success', jsPsych);
  },
  trial_duration: SUCCESS_SCREEN_DURATION,
});

export const successScreenFreezeFrame = (
  jsPsych: JsPsych,
  showFreezeFrame: boolean,
  keySettings: KeySettings,
): Trial => ({
  type: SuccessScreenPlugin,
  task: 'success',
  showFreezeFrame() {
    return showFreezeFrame || !checkLastTrialSuccess(jsPsych);
  },
  reasonMessage: () => {
    if (keySettings) {
      if (checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych))
        return KEY_TAPPED_EARLY_FIRST_ERROR_MESSAGE(keySettings);
      if (checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych)) {
        return KEY_RELEASED_EARLY_FIRST_ERROR_MESSAGE(keySettings);
      }
      if (checkTaps(jsPsych) <= MINIMUM_CALIBRATION_MEDIAN) {
        return NOT_ENOUGH_TAPS_FIRST_ERROR_MESSAGE(keySettings);
      }
      return SUCCESSFUL_FIRST_TRIAL_MESSAGE();
    }
    return '';
  },
  success() {
    return checkLastTrialSuccess(jsPsych);
  },
  trial_duration() {
    return showFreezeFrame || !checkLastTrialSuccess(jsPsych)
      ? SUCCESS_SCREEN_DURATION_FREEZE_FRAME
      : SUCCESS_SCREEN_DURATION;
  },
});
