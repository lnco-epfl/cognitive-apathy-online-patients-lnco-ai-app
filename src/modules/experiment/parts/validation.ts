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
import { DeviceType } from '../triggers/serialport';
import {
  CONTINUE_BUTTON_MESSAGE,
  ENABLE_BUTTON_AFTER_TIME,
} from '../utils/constants';
import { Timeline, Trial, ValidationPartType } from '../utils/types';

// Creates a tutorial trial that will be used to display the video tutorial for the validations trials with stimulus and changes the progress bar afterwards
// Should be merged with trial above
export const validationVideoTutorialTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [validationVideo(state.getKeySettings())],
  choices: [CONTINUE_BUTTON_MESSAGE()],
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
  device: DeviceType,
): Timeline => {
  const validationTimeline: Timeline = [];
  // User is displayed instructions and visual demonstration on how the validations trials will proceed
  validationTimeline.push(validationVideoTutorialTrial(jsPsych, state));
  validationTimeline.push(
    createValidationTrial(
      ValidationPartType.ValidationEasy,
      jsPsych,
      state,
      updateData,
      device,
    ),
    createValidationTrial(
      ValidationPartType.ValidationMedium,
      jsPsych,
      state,
      updateData,
      device,
    ),
    createValidationTrial(
      ValidationPartType.ValidationHard,
      jsPsych,
      state,
      updateData,
      device,
    ),
  );

  // Validation Failed Trial

  // Extra validation block -- runs only if any level exhausted all attempts
  validationTimeline.push({
    timeline: [validationTrialExtra(jsPsych, state, updateData, device)],
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
