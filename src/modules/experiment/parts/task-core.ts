import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  continueMessageDirectionContent,
  coreTaskInstructionPagesStimulus,
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
 *
 * @returns a set of instructions to step-by-step guide participants through the tapping task
 */
export const trialBlocksInstructionTimeline = (
  state: ExperimentState,
  remainingTrialBlocks: DelayType[] | undefined,
  trialBlock: DelayType[],
): Timeline =>
  coreTaskInstructionPagesStimulus(state).map((page) => ({
    type: HtmlButtonResponsePlugin,
    stimulus: [page],
    choices: [CONTINUE_BUTTON_MESSAGE()],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on_finish(data: any) {
      // eslint-disable-next-line no-param-reassign
      if (!remainingTrialBlocks) data.trialBlocksSequencing = trialBlock;
    },
  }));

/**
 *
 * @returns build the main core task
 */
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
  taskTimeline.push(
    ...trialBlocksInstructionTimeline(state, remainingTrialBlocks, trialBlock),
  );
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
