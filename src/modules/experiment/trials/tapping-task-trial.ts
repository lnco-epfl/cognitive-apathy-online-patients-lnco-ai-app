import { JsPsych, ParameterType } from 'jspsych';

import { stimulus } from '../jspsych/stimulus';
import {
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  GO_DURATION,
  NUM_TAPS_WITHOUT_DELAY,
  PATIENT_SAFETY_MARGIN,
  PRACTICE_MESSAGE,
  REHOLD_TIMEOUT,
  START_FIRST_TAP_INSTRUCTION,
  SUCCESSFUL_FIRST_TAP_MESSAGE,
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
  showFreezeFrame: boolean;
  showKeyboard: boolean;
  randomChanceAccepted: boolean;
  targetArea: boolean;
  usePhotoDiode: 'top-left' | 'top-right' | 'off';
  startPromptMessage?: string;
  continueTappingReminderMessage?: string;
  continueTappingReminderDelay?: number;
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
  medianTaps: number;
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
        type: ParameterType.INT,
        default: -1,
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
      showFreezeFrame: {
        type: ParameterType.BOOL,
        default: false,
      },
      showKeyboard: {
        type: ParameterType.BOOL,
        default: false,
      },
      startPromptMessage: {
        type: ParameterType.STRING,
        default: '',
      },
      continueTappingReminderMessage: {
        type: ParameterType.STRING,
        default: '',
      },
      continueTappingReminderDelay: {
        type: ParameterType.INT,
        default: 1200,
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
    let areKeysHeld = true;
    let errorOccurred = false;
    let isRunning = false;
    let trialEnded = false;
    let freezeFrameState: 'start' | 'firstTap' = 'start';
    let reholdTimeout: number | null = null;
    let continueReminderInterval: number | null = null;
    let lastTapTime = 0;
    const getStartMessageElement = (): HTMLElement | null =>
      document.getElementById('start-message') ??
      document.getElementById('start-message-element');

    const baseStartPromptMessage =
      trial.startPromptMessage ??
      PRACTICE_MESSAGE(trial.keyToPress, trial.keysToHold);
    const showContinueReminder = (): void => {
      const startMessageElement = getStartMessageElement();
      if (startMessageElement) {
        startMessageElement.innerHTML = `${baseStartPromptMessage}<br /><br /><strong style="font-weight: 800;">${trial.continueTappingReminderMessage}</strong>`;
      }
    };

    const flashTapCheckmark = (): void => {
      const checkmarkElement = document.createElement('div');
      checkmarkElement.innerText = '✓';
      checkmarkElement.style.position = 'absolute';
      checkmarkElement.style.top = '76%';
      checkmarkElement.style.left = '50%';
      checkmarkElement.style.transform = 'translate(-50%, -50%)';
      checkmarkElement.style.fontSize = '34px';
      checkmarkElement.style.color = '#2E7D32';
      checkmarkElement.style.opacity = '1';
      checkmarkElement.style.pointerEvents = 'none';
      checkmarkElement.style.transition = 'opacity 180ms ease-out';
      display_element.appendChild(checkmarkElement);

      this.jsPsych.pluginAPI.setTimeout(() => {
        checkmarkElement.style.opacity = '0';
      }, 30);

      this.jsPsych.pluginAPI.setTimeout(() => {
        checkmarkElement.remove();
      }, 220);
    };

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

    // const setError = (message: string): void => {
    //   error = message;
    //   updateUI();
    // };

    const isSuccess = (): boolean =>
      (this.mercuryHeight >= trial.bounds[0] - PATIENT_SAFETY_MARGIN &&
        this.mercuryHeight <= trial.bounds[1] + PATIENT_SAFETY_MARGIN &&
        !trial.keysReleasedFlag &&
        !trial.keyTappedEarlyFlag) ||
      randomSkip;

    const increaseMercury = (amount = trial.autoIncreaseAmount): void => {
      this.mercuryHeight = Math.min(this.mercuryHeight + amount, 100);
      updateUI();
    };

    const setAreKeysHeld = (): void => {
      if (trialEnded) return;

      areKeysHeld = trial.keysToHold.every((key) => keysState[key]);
      const startMessageElement = getStartMessageElement();

      if (startMessageElement) {
        startMessageElement.style.display = areKeysHeld ? 'block' : 'none';
      }
      if (!areKeysHeld && !trial.keyTappedEarlyFlag && !randomSkip) {
        // If keys were released, start a timeout to give user a chance to re-hold
        reholdTimeout = window.setTimeout(() => {
          if (!areKeysHeld) {
            // setError(PREMATURE_KEY_RELEASE_ERROR_MESSAGE());
            // eslint-disable-next-line no-param-reassign
            trial.keysReleasedFlag = true;
            // eslint-disable-next-line no-param-reassign
            // display_element.innerHTML = `
            //   <div id="status" style="margin-top: 50px;">
            //     <div id="error-message" style="color: red;">${PREMATURE_KEY_RELEASE_ERROR_MESSAGE()}</div>
            //   </div>
            // `;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            stopRunning(true);
            // setTimeout(
            //   () => stopRunning(true),
            //   PREMATURE_KEY_RELEASE_ERROR_TIME,
            // );
          }
        }, REHOLD_TIMEOUT);
      }
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
        lastTapTime = performance.now();
        if (trial.task === 'practice') {
          flashTapCheckmark();
        }
        const startMessageElement = getStartMessageElement();
        if (startMessageElement) {
          startMessageElement.innerHTML = baseStartPromptMessage;
        }
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
      // In the very first trial, update the freeze frame message to note first tap
      if (trial.showFreezeFrame) {
        if (freezeFrameState === 'start' && key === trial.keyToPress) {
          freezeFrameState = 'firstTap';
          const goElement = document.getElementById('go-message');
          if (goElement) {
            goElement.style.visibility = 'hidden';
          }
          const freezeFrameElement = document.getElementById('freeze-frame');
          if (freezeFrameElement) {
            freezeFrameElement.innerHTML = `          
            <div style="text-align:center; border: 5px solid #4CAF50; padding: 20px; margin: 20px; background-color: white; position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); z-index: 10; max-width: 600px; border-radius: 12px;">
              <!-- Success circle with checkmark -->
              <div style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                margin-bottom: 15px;
                border-radius: 50%;
                background-color: #4CAF50;
                color: white;
                font-weight: bold;
              " class="trial-icon">
                ✓
              </div>
              <p style="text-align:center; margin: 0;">
                ${SUCCESSFUL_FIRST_TAP_MESSAGE(trial.keyToPress)}
              </p>
            </div>`;
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            startRunning();
            this.jsPsych.pluginAPI.setTimeout(() => {
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              stopRunning();
            }, trial.trial_duration);
            setInterval(() => {
              freezeFrameElement.remove();
            }, trial.trial_duration);
            const taskContainer = document.getElementById('task-container');
            if (taskContainer) {
              taskContainer.style.visibility = 'visible';
            }
          }
        } else if (
          freezeFrameState === 'firstTap' &&
          key === trial.keyToPress
        ) {
          // Show small disappearing checkmark on subsequent taps
          const checkmarkElement = document.createElement('div');
          checkmarkElement.innerText = '✓';
          checkmarkElement.style.position = 'absolute';
          checkmarkElement.style.top = '80%';
          checkmarkElement.style.left = '50%';
          checkmarkElement.style.transform = 'translate(-50%, -50%)';
          checkmarkElement.style.fontSize = '32px';
          checkmarkElement.style.color = '#4CAF50';
          checkmarkElement.style.opacity = '1';
          display_element.appendChild(checkmarkElement);
          let opacity = 1;
          const fadeOutInterval = setInterval(() => {
            opacity -= 0.2;
            if (opacity <= 0) {
              clearInterval(fadeOutInterval);
              checkmarkElement.remove();
            } else {
              checkmarkElement.style.opacity = opacity.toString();
            }
          }, 30);
        }
      }
    };

    const endTrial = (): void => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);

      if (reholdTimeout) {
        clearTimeout(reholdTimeout);
        reholdTimeout = null;
      }
      if (continueReminderInterval) {
        clearInterval(continueReminderInterval);
        continueReminderInterval = null;
      }
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
        medianTaps:
          (100 +
            (trial.trial_duration / trial.autoDecreaseRate) *
              trial.autoDecreaseAmount) /
          trial.autoIncreaseAmount,
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
      if (trial.continueTappingReminderMessage) {
        lastTapTime = 0;
        if (continueReminderInterval) {
          clearInterval(continueReminderInterval);
          continueReminderInterval = null;
        }
        continueReminderInterval = window.setInterval(() => {
          if (trialEnded || !isRunning || tapCount === 0 || lastTapTime === 0) {
            return;
          }

          const inactiveTime = performance.now() - lastTapTime;
          if (inactiveTime >= (trial.continueTappingReminderDelay ?? 1200)) {
            showContinueReminder();
          }
        }, 200);
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
        trial.keysToHold,
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
      trial.keysToHold,
      trial.startPromptMessage,
    );

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    if (trial.keyTappedEarlyFlag && !randomSkip) {
      stopRunning(true);
      // eslint-disable-next-line no-param-reassign
      // display_element.innerHTML = `
      //   <div id="status" style="margin-top: 50px;">
      //     <div id="error-message" style="color: red;">${KEY_TAPPED_EARLY_MESSAGE()}</div>
      //   </div>
      // `;
      // setTimeout(() => stopRunning(true), KEY_TAPPED_EARLY_ERROR_TIME);
      return;
    }

    if (trial.showFreezeFrame) {
      // Show the freeze frame for 3000 ms before starting the trial
      const goElement = document.getElementById('go-message');
      if (goElement) {
        goElement.style.visibility = 'visible';
      }
      const taskContainer = document.getElementById('task-container');
      if (taskContainer) {
        taskContainer.style.visibility = 'hidden';
      }
      const freezeFrameElement = document.createElement('div');
      freezeFrameElement.id = 'freeze-frame';
      freezeFrameElement.innerHTML = `          
        <div style="text-align:center; border: 5px solid black; padding: 20px; margin: 20px; background-color: white; position: absolute; top:50%; left:50%; transform: translate(-50%, -50%);  z-index: 10; max-width: 600px; border-radius: 12px;">
          <!-- Success circle with checkmark -->
          <div style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            margin-bottom: 15px;
            border-radius: 50%;
            background-color: black;
            color: white;
            font-weight: bold;
          " class="trial-icon">
            i
          </div>
          <p style="text-align:center; margin: 0;">
            ${START_FIRST_TAP_INSTRUCTION(trial.keyToPress)}.
          </p>
        </div>`;
      display_element.appendChild(freezeFrameElement);
    } else {
      startRunning();
      this.jsPsych.pluginAPI.setTimeout(() => {
        stopRunning();
      }, trial.trial_duration);
    }
  }
}

export default TappingTask;
