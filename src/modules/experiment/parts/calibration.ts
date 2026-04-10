import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { calibrationTrial } from '../jspsych/calibration-trial';
import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  calibrationPart2Stimuli,
  finalCalibrationPart2Stimuli,
} from '../jspsych/stimulus';
import { DeviceType } from '../triggers/serialport';
import { CONTINUE_BUTTON_MESSAGE } from '../utils/constants';
import { CalibrationPartType, Timeline, Trial } from '../utils/types';

export const calibrationPart2InstructionTrial = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    return calibrationPart2Stimuli(state.getKeySettings());
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

  // // User is displayed information pertaining to how the calibration section of the experiment is structured
  // calibrationTimeline.push(calibrationSectionDirectionTrial(state));

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
  return calibrationTimeline;
};

export const buildFinalCalibration = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => {
  const finalCalibrationTimeline: Timeline = [];
  // User is displayed instructions on how the final calibration part 2 trials will proceed
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
