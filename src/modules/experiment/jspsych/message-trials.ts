import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import { JsPsych } from 'jspsych';

import {
  CALIBRATION_PART_1_DIRECTIONS,
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
  LIKERT_INTRO,
  PROGRESS_BAR,
  TRIAL_BLOCKS_DIRECTIONS,
} from '../utils/constants';
import { Trial } from '../utils/types';
import { changeProgressBar } from '../utils/utils';
import { finalNoStimuliVideo, finalStimuliVideo } from './stimulus';

// Contains the directions before the calibration part 1 at the start of the experiment
export const calibrationPart1DirectionTrial = {
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [CALIBRATION_PART_1_DIRECTIONS],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
};

// Contains the directions before the calibration part 1 after the 6 blocks of 63 trials
export const finalCalibrationSectionPart1 = {
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [finalNoStimuliVideo],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
};

// Contains the directions before the calibration part 2 after the 6 blocks of 63 trials
export const finalCalibrationSectionPart2 = {
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [finalStimuliVideo],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
};

// Contains the directions before the 6 blocks of 63 trials
export const trialBlocksDirection = (jsPsych: JsPsych): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [TRIAL_BLOCKS_DIRECTIONS],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
  on_finish() {
    changeProgressBar(
      `${PROGRESS_BAR.PROGRESS_BAR_TRIAL_BLOCKS}`,
      0.11,
      jsPsych,
    );
  },
});
// Likert prescreen for the blocks of trials
export const likertIntro = (): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [LIKERT_INTRO],
});

// Likert prescreen for the demo trials
export const likertIntroDemo = (): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [LIKERT_INTRO],
});
