import FullscreenPlugin from '@jspsych/plugin-fullscreen';
import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';

import { sitComfortablyStimuli } from '../jspsych/stimulus';
import {
  CONTINUE_BUTTON_MESSAGE,
  EXPERIMENT_BEGIN_MESSAGE,
  START_BUTTON_MESSAGE,
  TUTORIAL_INTRODUCTION_MESSAGE,
} from '../utils/constants';
import { Timeline, Trial } from '../utils/types';

/**
 *
 * @returns Returns a simple welcome screen that automatically triggers fullscreen when the start button is pressed
 */
const experimentBeginTrial = (): Trial => ({
  type: FullscreenPlugin,
  choices: [START_BUTTON_MESSAGE],
  message: [EXPERIMENT_BEGIN_MESSAGE],
  fullscreen_mode: true,
});

/**
 *
 * @returns Returns a simple instruction to sit comfortably
 */
const sitComfortably = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus: [sitComfortablyStimuli],
});

/**
 *
 * @returns Returns a simple summary of what will follow next, including the practice and callibration steps
 */
const tutorialIntroductionTrial = (): Timeline => [
  {
    type: HtmlButtonResponsePlugin,
    choices: [CONTINUE_BUTTON_MESSAGE],
    stimulus: [TUTORIAL_INTRODUCTION_MESSAGE],
  },
];

/**
 * Function that builds the first introduction to the experiment consiting of four steps the user goes through before practice starts
 * @param jsPsych containing the current experiment variable
 * @param state containing the state of this experiment, including variables that track its progress and its settings
 * @returns return a set of trials that will guide the user through the initial introduction in a linear manner
 */
export const buildIntroduction = (): Timeline => {
  const instructionTimeline: Timeline = [];

  // Initiate UserID trial, in LNCO.ai this is possibly not necessary because we get this information from the context
  // instructionTimeline.push(getUserIDTrial(state, jsPsych));
  // User will enter fullscreen on button click
  instructionTimeline.push(experimentBeginTrial());
  // User is displayed image demonstrating how they should sit
  instructionTimeline.push(sitComfortably());
  // User is displayed information pertaining to how the beginning section of the experiment is ordered
  instructionTimeline.push(tutorialIntroductionTrial());

  return instructionTimeline;
};
