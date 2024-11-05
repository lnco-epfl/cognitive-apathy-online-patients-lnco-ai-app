import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import { JsPsych } from 'jspsych';

import { loadingBar } from '../jspsych/stimulus';
import {
  LOADING_BAR_SPEED_NO,
  LOADING_BAR_SPEED_YES,
} from '../utils/constants';
import { Trial } from '../utils/types';

/**
 * A trial that displays a loading bar after a tapping trial to give the participant some mandatory rest
 * @param acceptance boolean that indicates if the trial was accepted (requires longer rest -> increased loading time)
 * @param jsPsych experiment variable
 * @returns trial with loading bar
 */
export const loadingBarTrial = (
  acceptance: boolean,
  jsPsych: JsPsych,
): Trial => ({
  type: HtmlKeyboardResponsePlugin,
  stimulus: loadingBar(),
  choices: 'NO_KEYS',
  on_load() {
    let percentage = 0;
    // Recursive function to update the percentage until 100% is reached
    const updatePercentage = (): void => {
      // Get the two HTML elements impacted by the percentage (percentage value and progress-bar)
      const percentageElement = document.querySelector('.percentage');
      const progressBarElement = document.querySelector('.progress');

      // Calculate the new percentage
      const increment = acceptance
        ? Math.ceil(Math.random() * LOADING_BAR_SPEED_YES)
        : Math.ceil(Math.random() * LOADING_BAR_SPEED_NO);
      percentage = Math.min(percentage + increment, 100);

      // Update the two HTML elements, the value and the progress bar
      if (percentageElement)
        percentageElement.textContent = percentage.toString();
      if (progressBarElement)
        progressBarElement.setAttribute('style', `width:${percentage}%`);

      // If we're not yet at 100%, redo steps after 100ms, otherwise finish the loading-bar trial
      if (percentage < 100) {
        setTimeout(() => {
          updatePercentage();
        }, 100);
      } else {
        jsPsych.finishTrial();
      }
    };
    updatePercentage();
  },
  on_finish() {
    const loadingBarContainer = document.querySelector(
      '.loading-bar-container',
    );
    if (loadingBarContainer) {
      loadingBarContainer.remove();
    }
  },
});
