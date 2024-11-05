import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import {
  calibrationTrial,
  conditionalCalibrationTrial,
} from '../jspsych/calibration-trial';
import { ExperimentState } from '../jspsych/experiment-state-class';
import { calibrationStimuliObject, videoStimulus } from '../jspsych/stimulus';
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
export const calibrationSectionDirectionTrial = (jsPsych: JsPsych): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [CALIBRATION_SECTION_MESSAGE],
  on_finish() {
    changeProgressBar(
      `${PROGRESS_BAR.PROGRESS_BAR_CALIBRATION}`,
      0.11,
      jsPsych,
    );
  },
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
): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [calibrationStimuliObject[calibrationPart]],
  choices: [CONTINUE_BUTTON_MESSAGE],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
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
): Timeline => {
  const calibrationTimeline: Timeline = [];

  // User is displayed information pertaining to how the calibration section of the experiment is structured
  calibrationTimeline.push(calibrationSectionDirectionTrial(jsPsych));

  // User is displayed instructions on how the calibration part 1 trials will proceed
  calibrationTimeline.push(instructionalTrial(CALIBRATION_PART_1_DIRECTIONS));

  // Calibration part 1 proceeds (4 trials, user taps as fast as possible, no visual feedback)
  calibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart1,
      updateData,
    ),
  );

  // If the median tap count from calibrationTrialPart1 is less than MINIMUM_CALIBRATION_MEDIAN, conditionalCalibrationTrialPart1 is pushed (Warning so user taps faster, 4 trials, user taps as fast as possible, no visual feedback)
  calibrationTimeline.push(
    conditionalCalibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart1,
      updateData,
    ),
  );

  // User is displayed instructions and visual demonstration on how the calibration part 2 trials will proceed
  calibrationTimeline.push(
    calibrationVideo(jsPsych, CalibrationPartType.CalibrationPart2),
  );

  // Calibration part 2 proceeds (3 trials, user taps as fast as possible, visual feedback)
  calibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart2,
      updateData,
    ),
  );
  // If the median tap count from calibrationTrialPart2 is less than MINIMUM_CALIBRATION_MEDIAN, conditionalCalibrationTrialPart2 is pushed (Warning so user taps faster, 3 trials, user taps as fast as possible, visual feedback)

  calibrationTimeline.push(
    conditionalCalibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.CalibrationPart2,
      updateData,
    ),
  );

  return calibrationTimeline;
};

export const buildFinalCalibration = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
): Timeline => {
  const finalCalibrationTimeline: Timeline = [];
  // User is displayed instructions on how the final calibration part 1 trials will proceed
  finalCalibrationTimeline.push(
    calibrationVideo(jsPsych, CalibrationPartType.FinalCalibrationPart1),
  );
  // Calibration part 1 proceeds (3 trials, user taps as fast as possible, no visual feedback)
  finalCalibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.FinalCalibrationPart1,
      updateData,
    ),
  );
  // User is displayed instructions on how the final calibration part 1 trials will proceed
  finalCalibrationTimeline.push(
    calibrationVideo(jsPsych, CalibrationPartType.FinalCalibrationPart2),
  );
  // Calibration part 2 proceeds (3 trials, user taps as fast as possible, visual feedback)
  finalCalibrationTimeline.push(
    calibrationTrial(
      jsPsych,
      state,
      CalibrationPartType.FinalCalibrationPart2,
      updateData,
    ),
  );

  return finalCalibrationTimeline;
};
