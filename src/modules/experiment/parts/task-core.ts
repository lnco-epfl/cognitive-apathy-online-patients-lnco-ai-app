import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  continueMessageDirectionContent,
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
 * Simple trial with continue message after returning to uncompleted experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const continueMessageDirection = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [continueMessageDirectionContent()],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
});

/**
 * Simple Trial to at the beginning of the actual experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const trialBlocksDirection = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [trialBlocksDirectionContent()],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
});

/**
 * Simple Trial to at the beginning of the actual experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const rewardPageDirection = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [rewardDirectionContent()],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
});

export const buildTaskCore = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
  remainingTrialBlocks?: DelayType[],
): Timeline => {
  const taskTimeline: Timeline = [];
  // User is displayed instructions and visual demonstration on how the trial blocks will proceed
  let trialBlockStart = 0;
  if (remainingTrialBlocks) {
    trialBlockStart =
      state.getTaskSettings().taskBlockRepetitions *
        state.getTaskSettings().taskBlocksIncluded.length -
      remainingTrialBlocks.length;
  }
  let trialBlock;
  if (!remainingTrialBlocks) {
    trialBlock = generateTrialOrder(state);
  } else {
    trialBlock = remainingTrialBlocks;
    taskTimeline.push(continueMessageDirection());
  }
  taskTimeline.push({
    ...trialBlocksDirection(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on_finish(data: any) {
      // eslint-disable-next-line no-param-reassign
      if (!remainingTrialBlocks) data.trialBlocksSequencing = trialBlock;
    },
  });
  taskTimeline.push(rewardPageDirection());
  taskTimeline.push({
    timeline: trialBlock.map((delay: DelayType, index: number) =>
      generateTaskTrialBlock(
        jsPsych,
        state,
        delay,
        trialBlockStart + index,
        updateData,
        device,
      ),
    ),
  });

  return taskTimeline;
};
