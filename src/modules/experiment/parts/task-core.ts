import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  rewardDirectionContent,
  trialBlocksDirectionContent,
} from '../jspsych/stimulus';
import { generateTaskTrialBlock, generateTrialOrder } from '../jspsych/trials';
import { DeviceType } from '../triggers/serialport';
import {
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
} from '../utils/constants';
import { DelayType, Timeline, Trial } from '../utils/types';

/**
 * Simple Trial to at the beginning of the actual experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const trialBlocksDirection = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [trialBlocksDirectionContent],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
});

/**
 * Simple Trial to at the beginning of the actual experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const rewardPageDirection = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [rewardDirectionContent],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
});

export const buildTaskCore = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => {
  const taskTimeline: Timeline = [];

  // User is displayed instructions and visual demonstration on how the trial blocks will proceed
  taskTimeline.push(trialBlocksDirection());
  taskTimeline.push(rewardPageDirection());
  const trialBlock = generateTrialOrder(state);
  taskTimeline.push({
    timeline: trialBlock.map((delay: DelayType, index: number) =>
      generateTaskTrialBlock(jsPsych, state, delay, index, updateData, device),
    ),
  });

  return taskTimeline;
};
