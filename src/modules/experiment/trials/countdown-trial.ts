// eslint-disable-next-line import/no-extraneous-dependencies
import { JsPsych, ParameterType } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { KeyboardType, createKeyboard } from '../jspsych/keyboard';
import {
  COUNTDOWN_TIME,
  COUNTDOWN_TIMER_MESSAGE,
  HOLD_KEYS_MESSAGE,
} from '../utils/constants';
import { Trial } from '../utils/types';
import { getHoldKeys, getTapKey } from '../utils/utils';

export type CountdownTrialType = {
  keysToHold: string[];
  keyToPress: string;
  message: string;
  waitTime: number;
  initialText: string;
  allow_held_key: boolean;
  keyTappedEarlyFlag: boolean;
  showKeyboard: boolean;
  usePhotoDiode: 'top-left' | 'top-right' | 'off';
};

/**
 * @class CountdownTrialPlugin
 * @description A custom jsPsych plugin that creates a trial where participants must hold specified keys for a countdown period before proceeding.
 *
 * The trial includes:
 * - Holding down specified keys (`keysToHold`).
 * - Displaying a countdown timer while the keys are held.
 * - Detecting if a specific key (`keyToPress`) is pressed too early, setting a flag (`keyTappedEarlyFlag`) if so.
 * - Optionally displaying an on-screen keyboard that synchronizes with the physical keyboard input.
 *
 * @param {Object} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @method trial - Executes the trial, handling UI setup, key events, and the countdown timer.
 *
 * Parameters:
 * - `keysToHold` (STRING[]): The keys that must be held down during the countdown.
 * - `keyToPress` (STRING): The key that should not be pressed during the countdown.
 * - `message` (HTML_STRING): The initial message displayed to the participant.
 * - `waitTime` (INT): The duration of the countdown in seconds.
 * - `initialText` (STRING): The initial text displayed above the countdown timer.
 * - `allow_held_key` (BOOL): Whether holding the key(s) is allowed.
 * - `keyTappedEarlyFlag` (BOOL): A flag indicating if the key was pressed too early.
 * - `showKeyboard` (BOOL): A flag indicating whether to display an on-screen keyboard (for tutorial trials)
 *
 * @method formatTime - Formats the remaining time in the countdown into MM:SS format.
 * @method startCountdown - Starts the countdown timer when all specified keys are held.
 * @method endTrial - Ends the trial and sends the recorded data to jsPsych.
 * @method setAreKeysHeld - Checks if the required keys are being held down and starts or resets the countdown as needed.
 */
export class CountdownTrialPlugin {
  static info = {
    name: 'countdown-trial',
    version: '1.0',
    data: {
      task: {
        type: ParameterType.STRING,
      },
      keyTappedEarlyFlag: {
        type: ParameterType.BOOL,
      },
    },
    parameters: {
      keysToHold: {
        type: ParameterType.STRING,
        array: true,
      },
      keyToPress: {
        type: ParameterType.STRING,
        array: false,
      },
      message: {
        type: ParameterType.HTML_STRING,
      },
      waitTime: {
        type: ParameterType.INT,
        default: COUNTDOWN_TIME,
      },
      initialText: {
        type: ParameterType.STRING,
        default: COUNTDOWN_TIMER_MESSAGE,
      },
      allow_held_key: {
        type: ParameterType.BOOL,
        default: true,
      },
      keyTappedEarlyFlag: {
        type: ParameterType.BOOL,
        default: false,
      },
      showKeyboard: {
        type: ParameterType.BOOL,
        default: false,
      },
      usePhotoDiode: {
        type: ParameterType.STRING,
        default: 'off',
      },
    },
  };

  jsPsych: JsPsych;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(displayElement: HTMLElement, trial: CountdownTrialType): void {
    const keysState: { [key: string]: boolean } = {};
    trial.keysToHold.forEach((key: string) => {
      keysState[key.toLowerCase()] = false;
    });

    let areKeysHeld = false;
    let interval: number | null = null;
    let inputElement: HTMLInputElement | undefined;
    let keyboardInstance: KeyboardType;

    // Create a specific container for the message
    const messageContainer = document.createElement('div');
    messageContainer.id = 'message-container';
    messageContainer.innerHTML = trial.message;
    displayElement.appendChild(messageContainer);

    const directionsContainer = document.createElement('div');
    directionsContainer.id = 'directions-container';
    displayElement.appendChild(directionsContainer);

    const timerContainer = document.createElement('div');
    timerContainer.id = 'timer-container';
    displayElement.appendChild(timerContainer);

    // Show keyboard if showKeyboard parameter is set to true
    if (trial.showKeyboard) {
      const { keyboard } = createKeyboard(displayElement);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      keyboardInstance = keyboard;
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.className = 'input';
      inputElement.style.position = 'absolute';
      inputElement.style.top = '-9999px';
      document.body.appendChild(inputElement);
    }

    if (trial.usePhotoDiode !== 'off') {
      const photoDiodeElement = document.createElement('div');
      photoDiodeElement.className = `photo-diode photo-diode-black ${trial.usePhotoDiode}`;
      displayElement.appendChild(photoDiodeElement);
    }

    const setAreKeysHeld = (): void => {
      areKeysHeld = (trial.keysToHold || []).every(
        (key: string) => keysState[key.toLowerCase()],
      );
      if (areKeysHeld && !interval) {
        messageContainer.innerHTML = ''; // Hide the initial message
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        startCountdown();
      } else if (!areKeysHeld && interval) {
        clearInterval(interval);
        interval = null;
        messageContainer.innerHTML = trial.message; // Reset the display message
        directionsContainer.innerHTML = ''; // Clear the directions
        timerContainer.innerHTML = ''; // Clear the timer
        // eslint-disable-next-line no-param-reassign
        trial.keyTappedEarlyFlag = false;
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if ((trial.keysToHold || []).includes(key)) {
        keysState[key] = true;
        document.getElementById(`button_${key}`)?.classList.add('active');
        setAreKeysHeld();
      }
      if (key === trial.keyToPress.toLowerCase() && interval) {
        // eslint-disable-next-line no-param-reassign
        trial.keyTappedEarlyFlag = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if ((trial.keysToHold || []).includes(key)) {
        keysState[key] = false;
        document.getElementById(`button_${key}`)?.classList.remove('active');
        setAreKeysHeld();
      }
    };

    const endTrial = (): void => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);

      const trialData = {
        keyTappedEarlyFlag: trial.keyTappedEarlyFlag,
        task: 'countdown',
      };

      // eslint-disable-next-line no-param-reassign
      displayElement.innerHTML = ''; // Clear the DOM
      this.jsPsych.finishTrial(trialData);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const formatTime = (time: number): string => {
      const minutes = Math.floor(time / 1000 / 60);
      const seconds = Math.floor((time - minutes * 1000 * 60) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const startCountdown = (): void => {
      const waitTime = trial.waitTime * 1000; // convert to milliseconds
      const { initialText } = trial;
      const startTime = performance.now();

      timerContainer.innerHTML = `
        <p>${initialText}<span id="clock">${formatTime(waitTime)}</span></p>
      `;

      const clockElement = document.getElementById('clock');

      interval = window.setInterval(() => {
        const timeLeft = waitTime - (performance.now() - startTime);
        if (timeLeft <= 0) {
          clearInterval(interval!);
          interval = null;
          endTrial();
        } else {
          clockElement!.innerHTML = formatTime(timeLeft);
        }
      }, 250);
    };
  }
}

export const countdownStep = (state: ExperimentState): Trial => ({
  type: CountdownTrialPlugin,
  keysToHold: getHoldKeys(state),
  keyToPress: getTapKey(state),
  message: HOLD_KEYS_MESSAGE(state.getKeySettings()),
  data: {
    task: 'countdown',
  },
});
