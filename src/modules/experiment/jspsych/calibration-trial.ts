import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { countdownStep } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import TappingTask, { TappingTaskDataType } from '../trials/tapping-task-trial';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  ADDITIONAL_CALIBRATION_PART_1_DIRECTIONS,
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  CONTINUE_BUTTON_MESSAGE,
  EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
  TRIAL_DURATION,
} from '../utils/constants';
import {
  CalibrationPartType,
  CalibrationTrialParams,
  ConditionalCalibrationTrialParams,
  OtherTaskStagesType,
  Trial,
} from '../utils/types';
import {
  autoIncreaseAmountCalculation,
  calculateMedianTapCount,
  checkFlag,
  checkKeys,
  getHoldKeys,
  getTapKey,
} from '../utils/utils';
import { ExperimentState } from './experiment-state-class';
import { finishExperimentEarlyTrial } from './finish';

const handleSuccessfulCalibration = (
  calibrationPart: CalibrationPartType,
  state: ExperimentState,
  jsPsych: JsPsych,
  data: TappingTaskDataType,
): void => {
  // Varialbe to capture the total # of trials for this specific calibrationpart
  const numTrials = state.getRequiredSuccesses(calibrationPart);

  // Increase successful trials counter for the respective calibration part
  state.incrementCalibrationSuccesses(calibrationPart);

  // Calculate median for the respective trial and set it in the correct state key
  state.updateMedianTaps(
    calibrationPart,
    calculateMedianTapCount(calibrationPart, numTrials, jsPsych),
  );

  if (
    calibrationPart === CalibrationPartType.CalibrationPart1 &&
    state.getState().medianTaps.calibrationPart1 >=
      state.getSettings().calibrationSettings.minimumCalibrationMedianTaps
  ) {
    state.setCalibrationPassed(CalibrationPartType.CalibrationPart1);
  }
  if (
    calibrationPart === CalibrationPartType.CalibrationPart2 &&
    state.getState().medianTaps.calibrationPart2 >=
      state.getCalibrationSettings().minimumCalibrationMedianTaps
  ) {
    state.setCalibrationPassed(CalibrationPartType.CalibrationPart2);
  }
  // eslint-disable-next-line no-param-reassign
  data.medianTaps = state.getState().medianTaps;
};

function isCalibrationPartCompleted(
  calibrationPart: CalibrationPartType,
  state: ExperimentState,
): boolean {
  // Get the current and required successes per calibration part
  const requiredSuccesses = state.getRequiredSuccesses(calibrationPart);
  const currentSuccesses = state.getCurrentSuccesses(calibrationPart);

  // Calculate remaining successes
  return requiredSuccesses <= currentSuccesses;
}

/**
 * Create the actual tappingtask trial for a single calibration trial --> See createCalibrationTrial for more details
 * @param param0 an object with the configurations for the calibration trial
 * @returns the calibration tapping task trial
 */
const calibrationTrialBody = ({
  showThermometer,
  bounds,
  calibrationPart,
  jsPsych,
  state,
  device,
}: CalibrationTrialParams): Trial => ({
  type: TappingTask,
  keysToHold: getHoldKeys(state),
  keyToPress: getTapKey(state),
  task: calibrationPart,
  trial_duration: TRIAL_DURATION,
  showThermometer,
  bounds,
  autoIncreaseAmount() {
    return autoIncreaseAmountCalculation(
      EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
      TRIAL_DURATION,
      AUTO_DECREASE_RATE,
      AUTO_DECREASE_AMOUNT,
      state.getState().medianTaps[
        calibrationPart === CalibrationPartType.FinalCalibrationPart2
          ? CalibrationPartType.FinalCalibrationPart1
          : CalibrationPartType.CalibrationPart1
      ],
    );
  },
  on_start(trial: Trial) {
    if (device.device) {
      sendSerialTrigger(device, {
        outsideTask: true,
        decisionTrigger: false,
        isEnd: false,
      });
    }

    sendPhotoDiodeTrigger(state.getPhotoDiodeSettings().usePhotoDiode, false);

    const keyTappedEarlyFlag = checkFlag(
      OtherTaskStagesType.Countdown,
      'keyTappedEarlyFlag',
      jsPsych,
    );
    // Update the trial parameters with keyTappedEarlyFlag
    // eslint-disable-next-line no-param-reassign
    trial.keyTappedEarlyFlag = keyTappedEarlyFlag;
  },
  on_finish(data: TappingTaskDataType) {
    // Only check calibration fail logic if the key was not tapped early and if the keys were not released early
    // and, in case of the final calibration, if the minimum taps was not reached
    /* Disable the photodiode trigger in case used */
    if (device.device) {
      sendSerialTrigger(device, {
        outsideTask: true,
        decisionTrigger: false,
        isEnd: true,
      });
    }

    sendPhotoDiodeTrigger(state.getPhotoDiodeSettings().usePhotoDiode, true);

    if (
      !data.keysReleasedFlag &&
      !data.keyTappedEarlyFlag &&
      !(
        [
          CalibrationPartType.FinalCalibrationPart1,
          CalibrationPartType.FinalCalibrationPart2,
        ].includes(calibrationPart) &&
        data.tapCount <
          state.getCalibrationSettings().minimumCalibrationMedianTaps
      )
    ) {
      handleSuccessfulCalibration(calibrationPart, state, jsPsych, data);
    }
  },
});

/**
 * Creates a calibration trial object.
 *
 * @param {Object} params - The parameters for creating the calibration trial.
 * @param {boolean} params.showThermometer - A flag indicating whether to display the thermometer during the trial.
 * @param {Object} params.bounds - The bounds for the calibration task, used to control the difficulty or thresholds for success.
 * @param {string} params.calibrationPart - The part of the calibration process this trial is for, e.g., 'calibrationPart1', 'finalCalibrationPart2'.
 * @param {Object} params.jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {Object} params.state - The state object to track and store various pieces of data during the trial, such as median tap counts and success counters.
 *
 * @returns {Object} - A jsPsych trial object with a timeline and looping logic for running a calibration task.
 *
 * The trial consists of the following steps:
 * - CountdownStep: Displays "hold the keys and the following countdown." If the user clicks the key early at this step, a flag will be set and detected at the next trial start.
 * - TaskPlugin: The main calibration task, where the subject's taps and key presses are recorded (with or without stimuli).
 * - ReleaseKeysStep: The release the keys message (conditionally appears based on if user released keys at the end of the trial)
 * - LoadingBarTrial: Creates a fake loading bar If the parameter is set to true, loadingBarTrial(true, jsPsych), the loading bar speed will be slower, giving the user a longer break.
 *
 * Key Functions:
 * - `autoIncreaseAmount`: Calculates the amount by which the mercury should raise on every tap based on a calculated median tap.
 * - `on_start`: Updates keyTappedEarlyFlag trial parameter  if the key was tapped early during CountdownStep.
 * - `on_finish`: Updates median tap count based on which calibration trial is being created and updates state variables related to calibration failures.
 * - `loop_function`: Repeats a trial if the keys were tapped early or if the keys were released early.
 *
 * This function is designed to create a customizable calibration trial object and handle logic related to calibration failures and successes.
 */
export const createCalibrationTrial = ({
  showThermometer,
  bounds,
  calibrationPart,
  jsPsych,
  state,
  device,
}: CalibrationTrialParams): Trial => ({
  timeline: [
    // Start with the countdown step
    countdownStep(state),
    // Then add the main tapping test step
    calibrationTrialBody({
      showThermometer,
      bounds,
      calibrationPart,
      jsPsych,
      state,
      device,
    }),
    // Add the Release Keys message trial at the end of the task
    {
      timeline: [releaseKeysStep(state)],
      conditional_function() {
        return checkKeys(calibrationPart, jsPsych);
      },
    },
    // Add the loading bar trial to give the subject recovery time
    {
      ...loadingBarTrial(true, jsPsych),
    },
  ],
  // Add a loop in case of failure
  loop_function() {
    return !isCalibrationPartCompleted(calibrationPart, state);
  },
});

/**
 * @function createConditionalCalibrationTrial
 * @description Creates a conditional calibration trial that only occurs if certain calibration conditions are not met in a prior trial.
 *
 * @param {Object} params - The parameters for creating the conditional calibration trial.
 * @param {string} params.calibrationPart - The part of the calibration process this trial is for, e.g., 'calibrationPart1', 'calibrationPart2'.
 * @param {Object} params.jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {Object} params.state - The state object to track and store various pieces of data during the trial, such as median tap counts and success counters.
 *
 * @returns {Object} - A jsPsych trial object with a timeline and conditional logic for running a calibration task only if certain conditions are met.
 *
 * The trial consists of the following steps:
 * - Displays additional instructions for the participant to prepare for the trial.
 * - Resets the success counters if a calibration part is repeated.
 * - Runs the calibration trial using the `createCalibrationTrial` function.
 * - Checks if the median tap count meets the minimum requirement; if not, it ends the experiment early.
 *
 * The entire trial is conditionally run based on whether the corresponding calibration part failed in a previous trial due to not reaching the minimum median taps.
 */
export const createConditionalCalibrationTrial = (
  { calibrationPart, jsPsych, state }: ConditionalCalibrationTrialParams,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => ({
  timeline: [
    // Add a trial with the directions that the user should tap faster
    {
      type: htmlButtonResponse,
      choices: [CONTINUE_BUTTON_MESSAGE],
      stimulus() {
        // Reset success counters for the calibration trials completed after minimum taps not reached
        state.updateCalibrationSuccesses(calibrationPart, 0);
        return `<p>${ADDITIONAL_CALIBRATION_PART_1_DIRECTIONS(state.getKeySettings())}</p>`;
      },
    },
    createCalibrationTrial({
      showThermometer: calibrationPart === CalibrationPartType.CalibrationPart2,
      bounds: [
        EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
        EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
      ],
      calibrationPart,
      jsPsych,
      state,
      device,
    }),
    {
      // If minimum taps is not reached in this set of conditional trials, then end experiment
      timeline: [finishExperimentEarlyTrial(jsPsych, updateData, state)],
      conditional_function() {
        return (
          state.getState().medianTaps[calibrationPart] <
          state.getCalibrationSettings().minimumCalibrationMedianTaps
        );
      },
    },
  ],
  // Conditional trial section should only occur if the corresponding calibration part failed due to minimum taps previously
  conditional_function() {
    return !state.getState().calibrationPartsPassed[calibrationPart];
  },
});

/**
 * @function calibrationTrial
 * @description Creates the first calibration task, repeated
 *
 * @param {Object} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {Object} state - The state object to track and store various pieces of data during the trial, such as median tap counts and success counters.
 * @param {boolean} finalCalibration - boolean to indicate if this is the first or final calibration
 *
 * @returns {Object} - A jsPsych trial object that runs the first part of the calibration trial.
 *
 * The trial timeline includes the following:
 * - Runs a calibration trial using the `createCalibrationTrial` function without displaying a thermometer.
 * - Adjusts the progress bar upon successful completion of the trial.
 */
export const calibrationTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  calibrationPart: CalibrationPartType,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => ({
  timeline: [
    createCalibrationTrial({
      showThermometer: [
        CalibrationPartType.CalibrationPart2,
        CalibrationPartType.FinalCalibrationPart2,
      ].includes(calibrationPart),
      bounds: [
        EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
        EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
      ],
      calibrationPart,
      jsPsych,
      state,
      device,
    }),
  ],
  on_timeline_finish() {
    updateData(jsPsych.data.get());
  },
});

/**
 * @function conditionalCalibrationTrial
 * @description Creates a conditional copy of the first calibration task
 *
 * @param {Object} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {Object} state - The state object to track and store various pieces of data during the trial, such as median tap counts and success counters.
 *
 * @returns {Object} - A jsPsych trial object that runs a no-stimuli calibration trial only if the first calibration trial's median was below the minimum median required.
 *
 * The trial timeline includes the following:
 * - Runs a calibration trial using the `createConditionalCalibrationTrial` function without displaying a thermometer.
 * - Adjusts the progress bar upon successful completion of the trial.
 */
export const conditionalCalibrationTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  calibrationPart: CalibrationPartType,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => ({
  ...createConditionalCalibrationTrial(
    {
      calibrationPart,
      jsPsych,
      state,
    },
    updateData,
    device,
  ),
});
