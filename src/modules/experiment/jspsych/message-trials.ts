import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import { AudioNarration } from 'jspsych-audio-narration';

import { CONTINUE_BUTTON_MESSAGE, LIKERT_INTRO } from '../utils/constants';
import { Trial } from '../utils/types';

// Likert prescreen for the blocks of trials
export const likertIntro = (narration: AudioNarration): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [LIKERT_INTRO()],
  on_load() {
    narration.play('assets/audio/likert-intro.mp3');
  },
  on_finish() {
    narration.stop();
  },
});
