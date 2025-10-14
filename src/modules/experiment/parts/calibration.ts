import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import {
  calibrationTrial,
  conditionalCalibrationTrial,
} from '../jspsych/calibration-trial';
import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  calibrationIntroductionStimuli,
  calibrationPart1Stimuli,
  calibrationPart2Stimuli,
  finalCalibrationPart1Stimuli,
  finalCalibrationPart2Stimuli,
} from '../jspsych/stimulus';
import { DeviceType } from '../triggers/serialport';
import { CONTINUE_BUTTON_MESSAGE } from '../utils/constants';
import { CalibrationPartType, Timeline, Trial } from '../utils/types';

/**
 * Display the preamble before the calibration at the start of the experiment
 * @param jsPsych containing the experiment
 * @returns the trial that shows the pre calibration screens
 */
export const calibrationSectionDirectionTrial = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    return calibrationIntroductionStimuli(state.getKeySettings());
  },
});

export const calibrationPart1InstructionTrial = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    return calibrationPart1Stimuli(state.getKeySettings());
  },
});

export const calibrationPart2InstructionTrial = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    return calibrationPart2Stimuli(state.getKeySettings());
  },
});

export const finalCalibrationPart1InstructionTrial = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    return finalCalibrationPart1Stimuli(state.getKeySettings());
  },
});

export const finalCalibrationPart2InstructionTrial = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    return finalCalibrationPart2Stimuli(state.getKeySettings());
  },
});

export const buildCalibration = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => {
  const calibrationTimeline: Timeline = [];

  // User is displayed information pertaining to how the calibration section of the experiment is structured
  calibrationTimeline.push(calibrationSectionDirectionTrial(state));

  // User is displayed instructions on how the calibration part 1 trials will proceed
  calibrationTimeline.push(calibrationPart1InstructionTrial(state));

  // Calibration part 1 proceeds (4 trials, user taps as fast as possible, no visual feedback)
  calibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart1,
      updateData,
      device,
    ),
  );

  // If the median tap count from calibrationTrialPart1 is less than MINIMUM_CALIBRATION_MEDIAN, conditionalCalibrationTrialPart1 is pushed (Warning so user taps faster, 4 trials, user taps as fast as possible, no visual feedback)
  calibrationTimeline.push(
    conditionalCalibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart1,
      updateData,
      device,
    ),
  );

  // User is displayed instructions and visual demonstration on how the calibration part 2 trials will proceed
  calibrationTimeline.push(calibrationPart2InstructionTrial(state));

  // Calibration part 2 proceeds (3 trials, user taps as fast as possible, visual feedback)
  calibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart2,
      updateData,
      device,
    ),
  );
  // If the median tap count from calibrationTrialPart2 is less than MINIMUM_CALIBRATION_MEDIAN, conditionalCalibrationTrialPart2 is pushed (Warning so user taps faster, 3 trials, user taps as fast as possible, visual feedback)

  calibrationTimeline.push(
    conditionalCalibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart2,
      updateData,
      device,
    ),
  );

  return calibrationTimeline;
};

export const buildFinalCalibration = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => {
  const finalCalibrationTimeline: Timeline = [];
  // User is displayed instructions on how the final calibration part 1 trials will proceed
  finalCalibrationTimeline.push(finalCalibrationPart1InstructionTrial(state));
  // Calibration part 1 proceeds (3 trials, user taps as fast as possible, no visual feedback)
  finalCalibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.FinalCalibrationPart1,
      updateData,
      device,
    ),
  );
  // User is displayed instructions on how the final calibration part 1 trials will proceed
  finalCalibrationTimeline.push(finalCalibrationPart2InstructionTrial(state));
  // Calibration part 2 proceeds (3 trials, user taps as fast as possible, visual feedback)
  finalCalibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.FinalCalibrationPart2,
      updateData,
      device,
    ),
  );

  return finalCalibrationTimeline;
};
