import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { validationVideo } from '../jspsych/stimulus';
import {
  createValidationTrial,
  validationResultScreen,
  validationTrialExtra,
} from '../jspsych/validation-trial';
import { likertFinalQuestionAfterValidation } from '../trials/likert-trial';
import {
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
} from '../utils/constants';
import {
  BoundsType,
  Timeline,
  Trial,
  ValidationPartType,
} from '../utils/types';

// Creates a tutorial trial that will be used to display the video tutorial for the validations trials with stimulus and changes the progress bar afterwards
// Should be merged with trial above
export const validationVideoTutorialTrial = (jsPsych: JsPsych): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [validationVideo],
  choices: [CONTINUE_BUTTON_MESSAGE],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
  on_finish() {
    // Clear the display element
    // eslint-disable-next-line no-param-reassign
    jsPsych.getDisplayElement().innerHTML = '';
  },
});

export const buildValidation = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
): Timeline => {
  const validationTimeline: Timeline = [];
  // User is displayed instructions and visual demonstration on how the validations trials will proceed
  validationTimeline.push(validationVideoTutorialTrial(jsPsych));
  // Easy validation trials are pushed (4 trials, user must end with top of red bar in target area, bounds are [30,50])
  state.getTaskSettings().taskBoundsIncluded.forEach((bounds) => {
    let validationPart: ValidationPartType;
    switch (bounds) {
      case BoundsType.Easy:
        validationPart = ValidationPartType.ValidationEasy;
        break;
      case BoundsType.Medium:
        validationPart = ValidationPartType.ValidationMedium;
        break;
      case BoundsType.Hard:
      default:
        validationPart = ValidationPartType.ValidationHard;
        break;
    }
    validationTimeline.push(
      createValidationTrial(validationPart, jsPsych, state, updateData),
    );
  });

  // If 3/4 or more of any of the group of the validation trials are failed for any reason, validationTrialExtra is pushed (3 trials, user must end with top of red bar in target area, bounds are [70,90])
  validationTimeline.push({
    ...validationTrialExtra(jsPsych, state, updateData),
    conditional_function() {
      return state.getState().validationState.extraValidationRequired;
    },
  });

  // Fatigue and motivation likert questions are asked as a baseline
  validationTimeline.push(likertFinalQuestionAfterValidation());

  // Showcase the final result screen of the validation
  validationTimeline.push(validationResultScreen(jsPsych, state, updateData));

  return validationTimeline;
};
