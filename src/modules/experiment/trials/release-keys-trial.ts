import { JsPsych, ParameterType } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { RELEASE_KEYS_MESSAGE } from '../utils/constants';
import { Trial } from '../utils/types';
import { getHoldKeys } from '../utils/utils';

export type ReleaseKeysType = {
  stimulus: string;
  valid_responses: string[];
  stimulus_duration: number;
  trial_duration: number;
  allow_held_key: boolean;
};

/**
 * @class ReleaseKeysPlugin
 * @description A custom jsPsych plugin that creates a trial where participants are instructed to release specific keys before proceeding.
 *
 * The trial includes:
 * - Displaying a stimulus (message) that instructs participants to release specific keys.
 * - Monitoring the specified keys to detect when they are released.
 * - Ending the trial automatically when all specified keys are released or when the "Enter" key is pressed.
 * - Optionally setting a duration for the stimulus display or the entire trial.
 *
 * @param {Object} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @method trial - Executes the trial, handling UI setup, key event monitoring, and trial termination.
 *
 * Parameters:
 * - `stimulus` (HTML_STRING): The message displayed to the participant instructing them to release the keys.
 * - `valid_responses` (KEYS[]): The keys that are monitored during the trial to ensure they are released.
 * - `stimulus_duration` (INT): The duration the stimulus is displayed before it is removed (optional).
 * - `trial_duration` (INT): The duration of the entire trial before it ends automatically (optional).
 * - `allow_held_key` (BOOL): A flag indicating whether held keys are allowed (default is true).
 *
 * @method handleKeyUp - Handles the `keyup` event, updating the keys' state and checking if all monitored keys have been released.
 * @method handleKeyDown - Handles the `keydown` event, updating the keys' state if they are pressed again.
 * @method checkIfAllKeysReleased - Checks if all specified keys have been released and ends the trial if they have.
 * @method endTrial - Ends the trial, cleans up event listeners, and sends the recorded data to jsPsych.
 */
export class ReleaseKeysPlugin {
  static info = {
    name: 'release-keys',
    version: '1.0',
    parameters: {
      stimulus: {
        type: ParameterType.HTML_STRING,
        default: `<p>${RELEASE_KEYS_MESSAGE}</p>`,
      },
      valid_responses: {
        type: ParameterType.KEYS,
        array: true,
      },
      stimulus_duration: {
        type: ParameterType.INT,
        default: null,
      },
      trial_duration: {
        type: ParameterType.INT,
        default: null,
      },
      allow_held_key: {
        type: ParameterType.BOOL,
        default: true,
      },
    },
  };

  jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element: HTMLElement, trial: ReleaseKeysType): void {
    const keysState: { [key: string]: boolean } = {};
    trial.valid_responses.forEach((key) => {
      keysState[key.toLowerCase()] = true;
    });
    const errorOccurred = false;

    // eslint-disable-next-line no-param-reassign
    display_element.innerHTML = trial.stimulus;

    // End the Release Keys trial
    const endTrial = (): void => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      document.removeEventListener('keyup', handleKeyUp);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      document.removeEventListener('keydown', handleKeyDown);
      // eslint-disable-next-line no-param-reassign
      display_element.innerHTML = '';
      this.jsPsych.finishTrial({ errorOccurred });
    };

    // Check if all keys are released
    const checkIfAllKeysReleased = (): boolean =>
      !Object.values(keysState).includes(true);

    // Event listener that keeps track of each key that is released
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (trial.valid_responses.includes(event.key.toLowerCase())) {
        keysState[event.key.toLowerCase()] = false;
        if (checkIfAllKeysReleased()) {
          endTrial();
        }
      }
      if (event.key === 'Enter') {
        endTrial();
      }
    };

    // Event listener that keeps track of each key that is pressed again
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (trial.valid_responses.includes(event.key.toLowerCase())) {
        keysState[event.key.toLowerCase()] = true;
      }
    };

    // Starting check to see if all keys are released at the start of the trial
    if (checkIfAllKeysReleased()) {
      endTrial();
    }
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleKeyDown);
  }
}

export const releaseKeysStep = (state: ExperimentState): Trial => ({
  type: ReleaseKeysPlugin,
  valid_responses: getHoldKeys(state),
});
