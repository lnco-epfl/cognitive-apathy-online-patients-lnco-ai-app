import FullscreenPlugin from '@jspsych/plugin-fullscreen';
import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  sitComfortablyStimuli,
  tutorialIntroductionStimuli,
} from '../jspsych/stimulus';
import {
  CONTINUE_BUTTON_MESSAGE,
  DOMINANT_HAND_MESSAGE,
  EXPERIMENT_BEGIN_MESSAGE,
  LEFT_HAND_BUTTON,
  RIGHT_HAND_BUTTON,
  START_BUTTON_MESSAGE,
} from '../utils/constants';
import { Timeline, Trial } from '../utils/types';

/**
 *
 * @returns Returns a simple welcome screen that automatically triggers fullscreen when the start button is pressed
 */
const experimentBeginTrial = (): Trial => ({
  type: FullscreenPlugin,
  choices: [START_BUTTON_MESSAGE()],
  message: [EXPERIMENT_BEGIN_MESSAGE()],
  fullscreen_mode: true,
});

/**
 *
 * @returns Returns a simple instruction to sit comfortably
 */
const sitComfortably = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [sitComfortablyStimuli()],
});

/**
 *
 * @returns Returns a simple summary of what will follow next, including agency and apathy tasks
 */
const tutorialIntroductionTrial = (): Timeline => [
  {
    type: HtmlButtonResponsePlugin,
    choices: [CONTINUE_BUTTON_MESSAGE()],
    stimulus: [tutorialIntroductionStimuli()],
  },
];

const askPreferredHand = (state: ExperimentState): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [DOMINANT_HAND_MESSAGE()],
  choices: [RIGHT_HAND_BUTTON(), LEFT_HAND_BUTTON()],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on_finish: (data: any) => {
    state.setPreferredHand(data.response === 0 ? 'right' : 'left');
    // eslint-disable-next-line no-param-reassign
    data.preferredHand = state.getPreferredHand();
  },
});

/**
 * Function that builds the first introduction to the experiment consiting of four steps the user goes through before practice starts
 * @param jsPsych containing the current experiment variable
 * @param state containing the state of this experiment, including variables that track its progress and its settings
 * @returns return a set of trials that will guide the user through the initial introduction in a linear manner
 */
export const buildIntroduction = (state: ExperimentState): Timeline => {
  const instructionTimeline: Timeline = [];
  // User will enter fullscreen on button click
  instructionTimeline.push(experimentBeginTrial());
  // User is displayed image demonstrating how they should sit
  instructionTimeline.push(sitComfortably());
  // User is displayed information pertaining to how the beginning section of the experiment is ordered
  // TODO: Review description of everything to come
  instructionTimeline.push(tutorialIntroductionTrial());
  instructionTimeline.push(askPreferredHand(state));

  return instructionTimeline;
};
