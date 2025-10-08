import htmlButtonResponse from '@jspsych/plugin-html-button-response';

import { CONTINUE_BUTTON_MESSAGE, LIKERT_INTRO } from '../utils/constants';
import { Trial } from '../utils/types';

// Likert prescreen for the blocks of trials
export const likertIntro = (): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [LIKERT_INTRO()],
});

// Likert prescreen for the demo trials
export const likertIntroDemo = (): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [LIKERT_INTRO()],
});
