import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { countdownStep } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import { successScreen } from '../trials/success-trial';
import TaskPlugin from '../trials/tapping-task-trial';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  CONTINUE_BUTTON_MESSAGE,
  EXPECTED_MAXIMUM_PERCENTAGE,
  FAILED_VALIDATION_MESSAGE,
  PASSED_VALIDATION_MESSAGE,
  PROGRESS_BAR,
  TRIAL_DURATION,
} from '../utils/constants';
import {
  BoundsType,
  OtherTaskStagesType,
  TaskTrialData,
  Trial,
  ValidationData,
  ValidationPartType,
} from '../utils/types';
import {
  autoIncreaseAmountCalculation,
  changeProgressBar,
  checkFlag,
  checkKeys,
  getHoldKeys,
  getTapKey,
} from '../utils/utils';
import { ExperimentState } from './experiment-state-class';
import { finishExperimentEarly } from './finish';

const defaultValidationBounds = {
  [ValidationPartType.ValidationEasy]: [5, 23],
  [ValidationPartType.ValidationMedium]: [41, 59],
  [ValidationPartType.ValidationHard]: [77, 95],
  [ValidationPartType.ValidationExtra]: [77, 95],
};

const validationBoundsType = {
  [ValidationPartType.ValidationEasy]: BoundsType.Easy,
  [ValidationPartType.ValidationMedium]: BoundsType.Medium,
  [ValidationPartType.ValidationHard]: BoundsType.Hard,
  [ValidationPartType.ValidationExtra]: BoundsType.Hard,
};

/**
 * @function handleValidationFinish
 * @description Handles the outcome of a validation trial by updating the state based on whether the participant succeeded or failed. It checks if additional validation trials are required based on the number of failures.
 *
 * This function includes:
 * - Updating the number of validation failures for the specific validation type.
 * - Checking if the participant failed enough trials to require additional validation trials.
 * - Setting the validation success flag based on the outcome of extra validation trials.
 *
 * @param {ValidationData} data - The data object from the validation trial, including the success status.
 * @param {string} validationName - The name of the validation trial (e.g., 'validationEasy', 'validationMedium').
 * @param {State} state - An object for storing and tracking state data during the trials, such as validation failures and success flags.
 */
export const handleValidationFinish = (
  data: ValidationData,
  validationStep: ValidationPartType,
  state: ExperimentState,
  jsPsych: JsPsych,
): void => {
  // Check if trial was unsuccessful, otherwise nothing needs to be done
  if (
    !data.success &&
    !checkFlag(validationStep, 'keyTappedEarlyFlag', jsPsych) &&
    !checkFlag(validationStep, 'keysReleasedFlag', jsPsych)
  ) {
    // Update number of failures for this validation step
    state.increaseValidationFailures(validationStep);
    // Calculate the number of failures allowed per validation step
    const numberOfFailuresAllowed =
      state.getValidationSettings().numberOfValidationsPerType *
      (1 -
        (validationStep !== ValidationPartType.ValidationExtra
          ? state.getValidationSettings()
              .percentageOfValidationSuccessesRequired
          : state.getValidationSettings()
              .percentageOfExtraValidationSuccessesRequired) /
          100);
    if (
      validationStep !== ValidationPartType.ValidationExtra &&
      state.getState().validationState.failures[validationStep] >
        numberOfFailuresAllowed
    ) {
      state.setExtraValidationRequired(true);
    } else if (
      validationStep === ValidationPartType.ValidationExtra &&
      state.getState().validationState.failures[validationStep] >
        numberOfFailuresAllowed
    ) {
      state.setValidationSuccess(false);
    }
  }
};

/**
 * @function createValidationTrial
 * @description Creates a validation trial where participants must perform a task with a specific set of bounds. The trial includes countdown, task performance, success screen, and key release steps.
 *
 * This function includes:
 * - Configuring the task with specific bounds and other parameters.
 * - Automatically adjusting the mercury level during the task based on participant performance.
 * - Handling trial success or failure and updating the state accordingly.
 * - Repeating the trial a specified number of times (repetitions).
 *
 * @param {number[]} bounds - The bounds for the mercury level during the task.
 * @param {string} validationName - The name of the validation trial (e.g., 'validationEasy', 'validationMedium').
 * @param {number} repetitions - The number of times the validation trial is repeated.
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {State} state - An object for storing and tracking state data during the trials, such as validation failures and success flags.
 *
 * @returns {Object} - A jsPsych trial object containing the timeline of steps for the validation trial.
 */
export const createValidationTrial = (
  validationName: ValidationPartType,
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => ({
  timeline: [
    {
      timeline: [
        {
          timeline: [
            countdownStep(state),
            {
              type: TaskPlugin,
              keysToHold: getHoldKeys(state),
              keyToPress: getTapKey(state),
              task: validationName,
              duration: TRIAL_DURATION,
              showThermometer: true,
              bounds: defaultValidationBounds[validationName],
              targetArea: true,
              autoIncreaseAmount() {
                return autoIncreaseAmountCalculation(
                  EXPECTED_MAXIMUM_PERCENTAGE,
                  TRIAL_DURATION,
                  AUTO_DECREASE_RATE,
                  AUTO_DECREASE_AMOUNT,
                  state.getState().medianTaps.calibrationPart2,
                );
              },
              data: {
                task: validationName,
              },
              on_start(trial: TaskTrialData) {
                if (device.device) {
                  sendSerialTrigger(device, {
                    outsideTask: true,
                    decisionTrigger: false,
                    bounds: validationBoundsType[validationName],
                    isEnd: false,
                  });
                }
                sendPhotoDiodeTrigger(
                  state.getPhotoDiodeSettings().usePhotoDiode,
                  false,
                );
                const keyTappedEarlyFlag = checkFlag(
                  OtherTaskStagesType.Countdown,
                  'keyTappedEarlyFlag',
                  jsPsych,
                );
                // Update the trial parameters with keyTappedEarlyFlag
                // eslint-disable-next-line no-param-reassign
                trial.keyTappedEarlyFlag = keyTappedEarlyFlag;
                return keyTappedEarlyFlag;
              },
              on_finish(data: ValidationData) {
                if (device.device) {
                  sendSerialTrigger(device, {
                    outsideTask: true,
                    decisionTrigger: false,
                    bounds: validationBoundsType[validationName],
                    isEnd: true,
                  });
                }
                sendPhotoDiodeTrigger(
                  state.getPhotoDiodeSettings().usePhotoDiode,
                  true,
                );
                // eslint-disable-next-line no-param-reassign
                data.task = validationName;
                handleValidationFinish(data, validationName, state, jsPsych);
                updateData(jsPsych.data.get());
              },
            },
            {
              timeline: [releaseKeysStep(state)],
              conditional_function() {
                return checkKeys(validationName, jsPsych);
              },
            },
            successScreen(jsPsych, validationName),
            {
              timeline: [loadingBarTrial(true, jsPsych)],
            },
          ],
          loop_function() {
            return (
              checkFlag(validationName, 'keyTappedEarlyFlag', jsPsych) ||
              checkFlag(validationName, 'keysReleasedFlag', jsPsych)
            );
          },
        },
      ],
      repetitions: state.getValidationSettings().numberOfValidationsPerType,
    },
  ],
});

/**
 * @function validationResultScreen
 * @description Displays a result screen after the validation trials, indicating whether the participant passed or failed the validation phase.
 *
 * This function includes:
 * - Displaying a message indicating whether the participant passed or failed the validation phase.
 * - Ending the experiment early if the participant failed the validation phase.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {State} state - An object for storing and tracking state data during the trials, such as the validation success flag.
 *
 * @returns {Object} - A jsPsych trial object that displays the validation result and handles the outcome.
 */
export const validationResultScreen = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus() {
    return state.getState().validationState.validationSuccess
      ? PASSED_VALIDATION_MESSAGE
      : FAILED_VALIDATION_MESSAGE;
  },
  on_finish() {
    if (!state.getState().validationState.validationSuccess) {
      finishExperimentEarly(jsPsych, updateData, state);
    }
  },
});

/**
 * @function validationTrialExtra
 * @description Creates a series of extra validation trials where participants must perform the task within the hardest bounds if they failed 3/4 or more of any of previous validation trial blocks.
 *
 * This function includes:
 * - Creating a timeline of extra validation trials with the hardest bounds.
 * - Updating the progress bar or ending the experiment if the participant does not succeed at least one extra validation trials.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {State} state - An object for storing and tracking state data during the trials, such as validation failures and success flags.
 *
 * @returns {Object} - A jsPsych trial object containing the extra validation trials and progress bar updates.
 */
export const validationTrialExtra = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => ({
  timeline: [
    createValidationTrial(
      ValidationPartType.ValidationExtra,
      jsPsych,
      state,
      updateData,
      device,
    ),
  ],
  on_timeline_finish() {
    if (
      state.getState().validationState.failures[
        ValidationPartType.ValidationExtra
      ] >= 3
    ) {
      changeProgressBar(
        `${PROGRESS_BAR.PROGRESS_BAR_TRIAL_BLOCKS}`,
        0,
        jsPsych,
      );
    }
  },
});
