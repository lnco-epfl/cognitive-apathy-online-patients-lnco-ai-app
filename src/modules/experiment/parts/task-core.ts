import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { generateTaskTrialBlock, generateTrialOrder } from '../jspsych/trials';
import {
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
  PROGRESS_BAR,
  TRIAL_BLOCKS_DIRECTIONS,
} from '../utils/constants';
import { DelayType, Timeline, Trial } from '../utils/types';
import { changeProgressBar } from '../utils/utils';

/**
 * Simple Trial to at the beginning of the actual experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const trialBlocksDirection = (jsPsych: JsPsych): Trial => ({
  type: HtmlButtonResponsePlugin,
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

export const buildTaskCore = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
): Timeline => {
  const taskTimeline: Timeline = [];

  // User is displayed instructions and visual demonstration on how the trial blocks will proceed
  taskTimeline.push(trialBlocksDirection(jsPsych));
  const trialBlock = generateTrialOrder(state);
  taskTimeline.push({
    timeline: trialBlock.map((delay: DelayType) =>
      generateTaskTrialBlock(jsPsych, state, delay, updateData),
    ),
  });

  return taskTimeline;
};
