import { JsPsych, ParameterType } from 'jspsych';

import {
  MedianTapsType,
  defaultMedianTaps,
} from '../jspsych/experiment-state-class';
import { type KeyboardType, createKeyboard } from '../jspsych/keyboard';
import { stimulus } from '../jspsych/stimulus';
import {
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  GO_DURATION,
  KEY_TAPPED_EARLY_ERROR_TIME,
  KEY_TAPPED_EARLY_MESSAGE,
  NUM_TAPS_WITHOUT_DELAY,
  PREMATURE_KEY_RELEASE_ERROR_MESSAGE,
  PREMATURE_KEY_RELEASE_ERROR_TIME,
  TRIAL_DURATION,
} from '../utils/constants';
import { TaskTrialData } from '../utils/types';
import { randomNumberBm } from '../utils/utils';

export type TappingTaskParametersType = {
  task: string;
  keysToHold: string[];
  keyToPress: string;
  randomDelay: [number, number];
  autoDecreaseAmount: number;
  autoDecreaseRate: number;
  autoIncreaseAmount: number;
  showThermometer: boolean;
  bounds: [number, number];
  trial_duration: number;
  keysReleasedFlag: boolean;
  reward: number;
  keyTappedEarlyFlag: boolean;
  showKeyboard: boolean;
  randomChanceAccepted: boolean;
  targetArea: boolean;
  usePhotoDiode: 'top-left' | 'top-right' | 'off';
};

export type TappingTaskDataType = {
  task: string;
  keyTappedEarlyFlag: boolean;
  tapCount: number;
  startTime: number;
  endTime: number;
  mercuryHeight: number;
  bounds: number[];
  reward: number;
  errorOccured: boolean;
  keysReleasedFlag: boolean;
  keysState: object;
  medianTaps: MedianTapsType;
};

/**
 * @class TappingTask
 * @description A custom jsPsych plugin that creates a task where participants must hold specific keys and tap another key to increase a virtual "mercury" level within bounds. The task monitors key presses, detects errors, and provides feedback.
 *
 * The trial includes:
 * - Displays a thermometer (if `showThermometer` is true) with a mercury level that participants aim to control by tapping a key.
 * - Monitoring the state of specified keys (`KEYS_TO_HOLD`) to ensure they are held down during the task.
 * - Providing real-time feedback to participants by increasing or decreasing the mercury level based on key presses.
 * - Handling errors such as premature key release or early key taps, displaying error messages, and terminating the trial if necessary.
 * - Recording detailed trial data, including the number of taps, time taken, mercury height, and success or failure of the task.
 *
 * @param {Object} jsPsych - The jsPsych instance used to control the experiment's flow.
 *
 * @method trial - Executes the trial, handling UI setup, key event monitoring, real-time feedback, and trial termination.
 *
 * Parameters:
 * - `task` (STRING): A label for the task being executed (e.g., 'demo', 'block').
 * - `autoDecreaseAmount` (FLOAT): The amount by which the mercury level decreases over every autoDecreaseRate amount of time.
 * - `autoDecreaseRate` (INT): The rate (in milliseconds) at which the mercury level decreases.
 * - `autoIncreaseAmount` (INT): The amount by which the mercury level increases with each valid key tap.
 * - `showThermometer` (BOOL): A flag indicating whether to display the thermometer UI.
 * - `bounds` (INT[]): An array specifying the lower and upper bounds for the mercury level to be considered successful.
 * - `trial_duration` (INT): The total duration of the trial before it ends automatically.
 * - `keysReleasedFlag` (BOOL): A flag indicating whether the participant released the keys prematurely.
 * - `randomDelay` (INT[]): An array specifying the minimum and maximum delay (in milliseconds) for increasing the mercury level after a key tap.
 * - `reward` (FLOAT): The reward value associated with the trial.
 * - `keyTappedEarlyFlag` (BOOL): A flag indicating whether the key was tapped too early during the countdown.
 * - `showKeyboard` (BOOL): A flag indicating whether to display an on-screen keyboard for participants to interact with.
 * - `randomChanceAccepted` (BOOL): A flag indicating whether the random chance criteria were met.
 *
 * @method handleKeyDown - Handles the `keydown` event, updating the state of held keys and starting the mercury increase process.
 * @method handleKeyUp - Handles the `keyup` event, updating the state of held keys and increasing the mercury level if the correct key is tapped.
 * @method startRunning - Initializes the task, starting the mercury level monitoring and real-time feedback.
 * @method stopRunning - Terminates the task, recording the outcome and cleaning up event listeners.
 * @method increaseMercury - Increases the mercury level by the specified amount, updating the UI accordingly.
 * @method setAreKeysHeld - Checks if all specified keys are being held down, displaying an error and stopping the trial if they are released prematurely.
 * @method setError - Sets an error message and updates the UI.
 * @method isSuccess - Determines whether the trial was successful based on the final mercury height and whether any errors occurred.
 * @method end_trial - Ends the trial, saves the trial data, and sends it to jsPsych for storage.
 *
 * @param {HTMLElement} display_element - The DOM element where the task's UI elements are rendered.
 */
class TappingTask {
  static info = {
    name: 'task-plugin',
    version: '1.0',
    data: {
      task: {
        type: ParameterType.STRING,
      },
      keyTappedEarlyFlag: {
        type: ParameterType.BOOL,
      },
      minimumTapsReached: {
        type: ParameterType.BOOL,
      },
      tapCount: {
        type: ParameterType.INT,
      },
      startTime: {
        type: ParameterType.INT,
      },
      endTime: {
        type: ParameterType.INT,
      },
      mercuryHeight: {
        type: ParameterType.FLOAT,
      },
      bounds: {
        type: ParameterType.COMPLEX,
      },
      reward: {
        type: ParameterType.FLOAT,
      },
      errorOccured: {
        type: ParameterType.BOOL,
      },
      keysReleasedFlag: {
        type: ParameterType.BOOL,
      },
      keysState: {
        type: ParameterType.OBJECT,
      },
      medianTaps: {
        type: ParameterType.OBJECT,
        default: defaultMedianTaps,
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
      task: {
        type: ParameterType.STRING,
        default: '',
      },
      autoDecreaseAmount: {
        type: ParameterType.FLOAT,
        default: AUTO_DECREASE_AMOUNT,
      },
      autoDecreaseRate: {
        type: ParameterType.INT,
        default: AUTO_DECREASE_RATE,
      },
      autoIncreaseAmount: {
        type: ParameterType.INT,
        default: 10,
      },
      showThermometer: {
        type: ParameterType.BOOL,
        default: true,
      },
      bounds: {
        type: ParameterType.INT,
        array: true,
        default: [20, 40],
      },
      trial_duration: {
        type: ParameterType.INT,
        default: TRIAL_DURATION,
      },
      keysReleasedFlag: {
        type: ParameterType.BOOL,
        default: false,
      },
      randomDelay: {
        type: ParameterType.INT,
        array: true,
        default: [0, 0],
      },
      reward: {
        type: ParameterType.FLOAT,
        default: 0,
      },
      keyTappedEarlyFlag: {
        type: ParameterType.BOOL,
        default: false,
      },
      showKeyboard: {
        type: ParameterType.BOOL,
        default: false,
      },
      randomChanceAccepted: {
        type: ParameterType.BOOL,
        default: false,
      },
      targetArea: {
        type: ParameterType.BOOL,
        default: false,
      },
      usePhotoDiode: {
        type: ParameterType.STRING,
        default: 'off',
      },
    },
  };

  private jsPsych: JsPsych;

  private mercuryHeight: number;

  private isKeyDown: boolean;

  constructor(jsPsych: JsPsych) {
    this.jsPsych = jsPsych;
    this.mercuryHeight = 0;
    this.isKeyDown = false;
  }

  trial(display_element: HTMLElement, trial: TappingTaskParametersType): void {
    let tapCount = 0;
    let startTime = 0;
    let endTime = 0;
    let error = '';
    const keysState: { [key: string]: boolean } = {};
    trial.keysToHold.forEach((key) => {
      keysState[key] = true;
    });
    let errorOccurred = false;
    let isRunning = false;
    let trialEnded = false;
    let keyboardInstance: KeyboardType;
    let inputElement: HTMLInputElement | undefined;

    const randomSkip = trial.randomChanceAccepted;

    const getRandomDelay = (): number => {
      const [min, max]: [number, number] = trial.randomDelay;
      return randomNumberBm(min, max);
    };

    const updateUI = (): void => {
      if (trial.showThermometer) {
        const mercuryElement = document.getElementById('mercury');
        if (mercuryElement)
          mercuryElement.style.height = `${this.mercuryHeight}%`;

        const lowerBoundElement = document.getElementById('lower-bound');
        const upperBoundElement = document.getElementById('upper-bound');
        if (lowerBoundElement)
          lowerBoundElement.style.bottom = `${trial.bounds[0]}%`;
        if (upperBoundElement)
          upperBoundElement.style.bottom = `${trial.bounds[1]}%`;
      }
      const errorMessageElement = document.getElementById('error-message');
      if (errorMessageElement) {
        errorMessageElement.innerText = error;
      }
    };

    if (trial.usePhotoDiode !== 'off') {
      const photoDiodeElement = document.createElement('div');
      photoDiodeElement.className = `photo-diode photo-diode-white ${trial.usePhotoDiode}`;
      display_element.appendChild(photoDiodeElement);
    }

    const setError = (message: string): void => {
      error = message;
      updateUI();
    };

    const isSuccess = (): boolean =>
      (this.mercuryHeight >= trial.bounds[0] &&
        this.mercuryHeight <= trial.bounds[1] &&
        !trial.keysReleasedFlag &&
        !trial.keyTappedEarlyFlag) ||
      randomSkip;

    const setAreKeysHeld = (): void => {
      if (trialEnded) return;

      const areKeysHeld = trial.keysToHold.every((key) => keysState[key]);
      const startMessageElement = document.getElementById('start-message');

      if (startMessageElement) {
        startMessageElement.style.display = areKeysHeld ? 'block' : 'none';
      }
      if (!areKeysHeld && !trial.keyTappedEarlyFlag && !randomSkip) {
        setError(PREMATURE_KEY_RELEASE_ERROR_MESSAGE);
        // eslint-disable-next-line no-param-reassign
        trial.keysReleasedFlag = true;
        // eslint-disable-next-line no-param-reassign
        display_element.innerHTML = `
            <div id="status" style="margin-top: 50px;">
              <div id="error-message" style="color: red;">${PREMATURE_KEY_RELEASE_ERROR_MESSAGE}</div>
            </div>
          `;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        setTimeout(() => stopRunning(true), PREMATURE_KEY_RELEASE_ERROR_TIME);
      }
    };

    const increaseMercury = (amount = trial.autoIncreaseAmount): void => {
      this.mercuryHeight = Math.min(this.mercuryHeight + amount, 100);
      updateUI();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (trial.keysToHold.includes(key)) {
        keysState[key] = true;
        setAreKeysHeld();
      } else if (key === trial.keyToPress && isRunning && !this.isKeyDown) {
        this.isKeyDown = true;
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (trial.keysToHold.includes(key)) {
        keysState[key] = false;
        setAreKeysHeld();
      } else if (key === trial.keyToPress && isRunning) {
        this.isKeyDown = false;
        tapCount += 1;
        if (
          (trial.task === 'demo' || trial.task === 'block') &&
          tapCount > NUM_TAPS_WITHOUT_DELAY
        ) {
          this.jsPsych.pluginAPI.setTimeout(
            () => increaseMercury(),
            getRandomDelay(),
          );
        } else {
          increaseMercury();
        }
      }
    };

    const endTrial = (): void => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      const trialData: TaskTrialData = {
        tapCount,
        startTime,
        endTime,
        mercuryHeight: this.mercuryHeight,
        error,
        bounds: trial.bounds,
        reward: trial.reward,
        task: trial.task,
        errorOccurred,
        keysReleasedFlag: trial.keysReleasedFlag,
        success: isSuccess(),
        keyTappedEarlyFlag: trial.keyTappedEarlyFlag,
        keysState,
      };

      this.jsPsych.finishTrial(trialData);
    };

    const startRunning = (): void => {
      if (randomSkip) {
        endTrial();
        return;
      }
      isRunning = true;
      startTime = this.jsPsych.getTotalTime();
      tapCount = 0;
      this.mercuryHeight = 0;
      error = '';
      updateUI();
      const goElement = document.getElementById('go-message');
      if (goElement) {
        goElement.style.visibility = 'visible';
        this.jsPsych.pluginAPI.setTimeout(() => {
          goElement.style.visibility = 'hidden';
        }, GO_DURATION);
      }
      const decreaseInterval = (): void => {
        this.mercuryHeight = Math.max(
          this.mercuryHeight - trial.autoDecreaseAmount,
          0,
        );
        updateUI();
        if (isRunning) {
          this.jsPsych.pluginAPI.setTimeout(
            decreaseInterval,
            trial.autoDecreaseRate,
          );
        }
      };
      decreaseInterval();
    };

    const stopRunning = (errorFlag = false): void => {
      if (trialEnded) return;
      // REMOVE GO IN CASE IT IS SHOWING FOR SOME REASON BEFORE TRIAL ENDS
      trialEnded = true;
      endTime = this.jsPsych.getTotalTime();
      isRunning = false;
      errorOccurred = errorFlag;
      const goElement = document.getElementById('go-message');
      if (goElement) {
        goElement.style.visibility = 'hidden';
      }
      // eslint-disable-next-line no-param-reassign
      display_element.innerHTML = stimulus(
        trial.showThermometer,
        this.mercuryHeight,
        trial.task,
        trial.bounds[0],
        trial.bounds[1],
        trial.targetArea,
        trial.keyToPress,
      );

      updateUI();
      endTrial();
    };

    // eslint-disable-next-line no-param-reassign
    display_element.innerHTML = stimulus(
      trial.showThermometer,
      this.mercuryHeight,
      trial.task,
      trial.bounds[0],
      trial.bounds[1],
      trial.targetArea,
      trial.keyToPress,
    );

    if (trial.showKeyboard) {
      const { keyboard, keyboardDiv } = createKeyboard(display_element);
      keyboardInstance = keyboard;
      inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.className = 'input';
      inputElement.style.position = 'absolute';
      inputElement.style.top = '-9999px';
      document.body.appendChild(inputElement);

      document.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (trial.keysToHold.includes(key) || key === trial.keyToPress) {
          keyboardInstance.setInput(inputElement!.value + key);
          const button = keyboardDiv.querySelector(`[data-skbtn="${key}"]`);
          if (button) {
            button.classList.add('hg-activeButton');
          }
        }
      });

      document.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        const button = keyboardDiv.querySelector(`[data-skbtn="${key}"]`);
        if (button && button instanceof HTMLElement) {
          button.classList.remove('hg-activeButton');
          button.style.backgroundColor = '';
          button.style.color = '';
        }
      });

      inputElement.addEventListener('input', (event) => {
        keyboardInstance.setInput((event.target as HTMLInputElement).value);
      });
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    if (trial.keyTappedEarlyFlag && !randomSkip) {
      // eslint-disable-next-line no-param-reassign
      display_element.innerHTML = `
        <div id="status" style="margin-top: 50px;">
          <div id="error-message" style="color: red;">${KEY_TAPPED_EARLY_MESSAGE}</div>
        </div>
      `;
      setTimeout(() => stopRunning(true), KEY_TAPPED_EARLY_ERROR_TIME);
      return;
    }

    startRunning();

    this.jsPsych.pluginAPI.setTimeout(() => {
      stopRunning();
    }, trial.trial_duration);
  }
}

export default TappingTask;
