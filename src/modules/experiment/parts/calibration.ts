import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import {
  calibrationTrial,
  conditionalCalibrationTrial,
} from '../jspsych/calibration-trial';
import { ExperimentState } from '../jspsych/experiment-state-class';
import { calibrationStimuliObject, videoStimulus } from '../jspsych/stimulus';
import { DeviceType } from '../triggers/serialport';
import {
  CALIBRATION_PART_1_DIRECTIONS,
  CALIBRATION_SECTION_MESSAGE,
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
  PROGRESS_BAR,
} from '../utils/constants';
import { CalibrationPartType, Timeline, Trial } from '../utils/types';
import { changeProgressBar } from '../utils/utils';

/**
 * Display the preamble before the calibration at the start of the experiment
 * @param jsPsych containing the experiment
 * @returns the trial that shows the pre calibration screens
 */
export const calibrationSectionDirectionTrial = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [CALIBRATION_SECTION_MESSAGE],
});

//
/**
 * Creates a tutorial trial that will be used to display directions for calibration part 1 before the task
 * @param message message to display for calibration
 * @returns the trial to display instructions
 */
export const instructionalTrial = (message: string): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus() {
    return videoStimulus(message);
  },
});

// Creates a tutorial trial that will be used to display the video tutorial for the calibration trials with stimulus and changes the progress bar afterwards
// Should be merged with trial above
const calibrationVideo = (
  jsPsych: JsPsych,
  calibrationPart: CalibrationPartType,
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [calibrationStimuliObject(state)[calibrationPart]],
  choices: [CONTINUE_BUTTON_MESSAGE],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
  on_start() {
    if (calibrationPart === CalibrationPartType.FinalCalibrationPart1) {
      changeProgressBar(
        `${PROGRESS_BAR.PROGRESS_BAR_FINAL_CALIBRATION}`,
        state.getProgressBarStatus('finalCal'),
        jsPsych,
      );
    }
  },
  on_finish() {
    // Clear the display element
    // eslint-disable-next-line no-param-reassign
    jsPsych.getDisplayElement().innerHTML = '';
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
  calibrationTimeline.push(calibrationSectionDirectionTrial());

  // User is displayed instructions on how the calibration part 1 trials will proceed
  calibrationTimeline.push(
    instructionalTrial(CALIBRATION_PART_1_DIRECTIONS(state.getKeySettings())),
  );

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
  calibrationTimeline.push(
    calibrationVideo(jsPsych, CalibrationPartType.CalibrationPart2, state),
  );

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
  finalCalibrationTimeline.push(
    calibrationVideo(jsPsych, CalibrationPartType.FinalCalibrationPart1, state),
  );
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
  finalCalibrationTimeline.push(
    calibrationVideo(jsPsych, CalibrationPartType.FinalCalibrationPart2, state),
  );
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
