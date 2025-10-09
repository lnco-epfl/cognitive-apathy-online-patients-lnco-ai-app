import { JsPsych, ParameterType } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { agencyTaskStimulus } from '../jspsych/stimulus';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  DEFAULT_BOUNDS,
  EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
  GET_BACK_IN_TARGET_MESSAGE,
  GO_DURATION,
  HOLD_KEYS_MESSAGE,
  KEEP_IN_TARGET_AGENCY_FREEZE_FRAME_INSTRUCTIONS,
  KEY_TAPPED_EARLY_ERROR_TIME,
  KEY_TAPPED_EARLY_MESSAGE,
  NUM_TAPS_WITHOUT_DELAY,
  PREMATURE_KEY_RELEASE_ERROR_MESSAGE,
  PREMATURE_KEY_RELEASE_ERROR_TIME,
  REQUIRED_TIME_IN_BOUNDS,
  START_FIRST_TAP_INSTRUCTION,
  TRIAL_DURATION,
} from '../utils/constants';
import { CalibrationPartType, Trial, TrialTypes } from '../utils/types';
import {
  autoIncreaseAmountCalculation,
  checkFlag,
  getHoldKeys,
  getTapKey,
  randomNumberBm,
} from '../utils/utils';

export type TappingTaskParametersType = {
  task: string;
  delayOriginal: number;
  autoDecreaseAmount: number;
  autoDecreaseRate: number;
  autoIncreaseAmount: number;
  showThermometer: boolean;
  bounds: [number, number];
  trial_duration: number;
  keysReleasedFlag: boolean;
  keysToHold: string[];
  keyToPress: string;
  keyTappedEarlyFlag: boolean;
  showFreezeFrame: boolean;
  showKeyboard: boolean;
  targetArea: boolean;
  requiredTimeInBounds: number;
};

export type TappingTaskDataType = {
  task: string;
  keyTappedEarlyFlag: boolean;
  delayOriginal: number;
  tapCount: number;
  startTime: number;
  endTime: number;
  mercuryHeight: number;
  error: string;
  bounds: number[];
  errorOccurred: boolean;
  keysReleasedFlag: boolean;
  success: boolean;
  keysState: object;
  requiredTimeInBounds: number;
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
 * - `keyTappedEarlyFlag` (BOOL): A flag indicating whether the key was tapped too early during the countdown.
 * - `showKeyboard` (BOOL): A flag indicating whether to display an on-screen keyboard for participants to interact with.
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
class AgencyTappingTask {
  static info = {
    name: 'task-plugin',
    version: '1.0',
    data: {
      task: {
        type: ParameterType.STRING,
      },
      delayOriginal: {
        type: ParameterType.INT,
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
      error: {
        type: ParameterType.STRING,
      },
      bounds: {
        type: ParameterType.COMPLEX,
      },
      requiredTimeInBounds: {
        type: ParameterType.INT,
      },
      errorOccurred: {
        type: ParameterType.BOOL,
      },
      keysReleasedFlag: {
        type: ParameterType.BOOL,
      },
      success: {
        type: ParameterType.BOOL,
      },
      keysState: {
        type: ParameterType.OBJECT,
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
      requiredTimeInBounds: {
        type: ParameterType.INT,
        default: REQUIRED_TIME_IN_BOUNDS,
      },
      showThermometer: {
        type: ParameterType.BOOL,
        default: true,
      },
      showFreezeFrame: {
        type: ParameterType.BOOL,
        default: true,
      },
      bounds: {
        type: ParameterType.INT,
        array: true,
        default: DEFAULT_BOUNDS,
      },
      keysReleasedFlag: {
        type: ParameterType.BOOL,
        default: false,
      },
      delayOriginal: {
        type: ParameterType.INT,
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
      targetArea: {
        type: ParameterType.BOOL,
        default: false,
      },
      trial_duration: {
        type: ParameterType.INT,
        default: TRIAL_DURATION,
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
    let inBoundsStartTime = 0;
    let timeInBounds = 0;
    let error = '';
    let freezeFrameElement: HTMLElement | null = null;
    let freezeFrameState: 'start' | 'in-target' | 'keep-inside' = 'start';

    const keysState: { [key: string]: boolean } = {};
    trial.keysToHold.forEach((key) => {
      keysState[key] = true;
    });
    let errorOccurred = false;
    let isRunning = false;
    let trialEnded = false;

    const getRandomDelay = (): number =>
      trial.delayOriginal === 0 ? 0 : randomNumberBm(0, trial.delayOriginal);

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

        const keepMessage = document.getElementById('keep-in-bounds-message'); // Show "keep red in blue region" message only for training trials
        const mercuryIsInBounds =
          this.mercuryHeight >= trial.bounds[0] &&
          this.mercuryHeight <= trial.bounds[1];
        if (keepMessage && trial.task === 'training') {
          if (mercuryIsInBounds) {
            keepMessage.style.visibility = 'visible';
          } else {
            keepMessage.style.visibility = 'hidden';
          }
        }

        if (
          trial.showFreezeFrame &&
          mercuryIsInBounds &&
          freezeFrameElement &&
          (freezeFrameState === 'start' || freezeFrameState === 'keep-inside')
        ) {
          freezeFrameState = 'in-target';
          freezeFrameElement.innerHTML = `        
            <div style="text-align:center; border: 5px solid #4CAF50; padding: 20px; margin: 20px; background-color: white; z-index: 10; max-width: 600px; border-radius: 12px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; margin-bottom: 15px;
                    border-radius: 50%; background-color: #4CAF50; color: white; font-size: 32px; font-weight: bold;">
                    ✓
                </div>
                <p style="text-align:center; font-size: 18px; margin: 0;">
                    ${KEEP_IN_TARGET_AGENCY_FREEZE_FRAME_INSTRUCTIONS()}.
                </p>
            </div>`;
        }

        if (
          trial.showFreezeFrame &&
          !mercuryIsInBounds &&
          freezeFrameElement &&
          freezeFrameState === 'in-target'
        ) {
          freezeFrameState = 'keep-inside';
          freezeFrameElement.innerHTML = `     
            <div style="text-align:center; border: 5px solid #FFC107; padding: 20px; margin: 20px; background-color: white; z-index: 10; max-width: 600px; border-radius: 12px;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; margin-bottom: 15px; border-radius: 50%;
                    background-color: #FFC107; color: white; font-size: 32px; font-weight: bold;
                ">
                    !
                </div>
                <p style="text-align:center; font-size: 18px; margin: 0;">
                    ${GET_BACK_IN_TARGET_MESSAGE()}.
                </p>
            </div>`;
        }

        const timerElement = document.getElementById('in-bounds-timer');
        const secondsElement = document.getElementById('clock');
        if (timerElement && secondsElement) {
          if (mercuryIsInBounds) {
            timerElement.style.visibility = 'visible';
            const remaining = Math.max(
              0,
              trial.requiredTimeInBounds - timeInBounds,
            );
            secondsElement.textContent = `0:0${Math.ceil(remaining / 1000)}`;
          } else {
            timerElement.style.visibility = 'hidden';
          }
        }
      }
      const errorMessageElement = document.getElementById('error-message');
      if (errorMessageElement) {
        errorMessageElement.innerText = error;
      }
    };

    const setError = (message: string): void => {
      error = message;
      updateUI();
    };

    const isSuccess = (): boolean =>
      this.mercuryHeight >= trial.bounds[0] &&
      this.mercuryHeight <= trial.bounds[1] &&
      !trial.keysReleasedFlag &&
      !trial.keyTappedEarlyFlag;

    const setAreKeysHeld = (): void => {
      if (trialEnded) return;

      const areKeysHeld = trial.keysToHold.every((key) => keysState[key]);
      const startMessageElement = document.getElementById('start-message');

      if (startMessageElement) {
        startMessageElement.style.display = areKeysHeld ? 'block' : 'none';
      }
      if (!areKeysHeld && !trial.keyTappedEarlyFlag) {
        setError(PREMATURE_KEY_RELEASE_ERROR_MESSAGE());
        // eslint-disable-next-line no-param-reassign
        trial.keysReleasedFlag = true;
        errorOccurred = true;
        // eslint-disable-next-line no-param-reassign
        display_element.innerHTML = `
            <div id="status" style="margin-top: 50px;">
              <div id="error-message" style="color: red"><b>${PREMATURE_KEY_RELEASE_ERROR_MESSAGE()}</b></div>
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
        if (tapCount > NUM_TAPS_WITHOUT_DELAY) {
          const delay = getRandomDelay();
          this.jsPsych.pluginAPI.setTimeout(() => increaseMercury(), delay);
        } else {
          increaseMercury();
        }
      }
    };

    const endTrial = (): void => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      const trialData: TappingTaskDataType = {
        tapCount,
        delayOriginal: trial.delayOriginal,
        startTime,
        endTime,
        mercuryHeight: this.mercuryHeight,
        error,
        bounds: trial.bounds,
        task: trial.task,
        errorOccurred,
        keysReleasedFlag: trial.keysReleasedFlag,
        success: isSuccess(),
        keyTappedEarlyFlag: trial.keyTappedEarlyFlag,
        keysState,
        requiredTimeInBounds: trial.requiredTimeInBounds,
      };

      this.jsPsych.finishTrial(trialData);
    };

    const stopRunning = (errorFlag = false): void => {
      if (trialEnded) return;
      // REMOVE GO IN CASE IT IS SHOWING FOR SOME REASON BEFORE TRIAL ENDS
      trialEnded = true;
      endTime = this.jsPsych.getTotalTime();
      isRunning = false;
      if (errorFlag) {
        errorOccurred = errorFlag;
      }
      const goElement = document.getElementById('go-message');
      if (goElement) {
        goElement.style.visibility = 'hidden';
      }
      // eslint-disable-next-line no-param-reassign
      display_element.innerHTML = agencyTaskStimulus(
        trial.showThermometer,
        this.mercuryHeight,
        trial.bounds[0],
        trial.bounds[1],
        trial.targetArea,
      );

      updateUI();
      endTrial();
    };

    const startRunning = (): void => {
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
          if (
            this.mercuryHeight >= trial.bounds[0] &&
            this.mercuryHeight <= trial.bounds[1]
          ) {
            if (inBoundsStartTime === 0) {
              inBoundsStartTime = performance.now();
            } else {
              const now = performance.now();
              timeInBounds = now - inBoundsStartTime;
              if (timeInBounds >= trial.requiredTimeInBounds) {
                stopRunning(false);
              }
            }
          } else {
            // Went out of bounds, so reset the timer
            inBoundsStartTime = 0;
            timeInBounds = 0;
          }
          this.jsPsych.pluginAPI.setTimeout(
            decreaseInterval,
            trial.autoDecreaseRate,
          );
        }
      };
      decreaseInterval();
    };

    // eslint-disable-next-line no-param-reassign
    display_element.innerHTML = agencyTaskStimulus(
      trial.showThermometer,
      this.mercuryHeight,
      trial.bounds[0],
      trial.bounds[1],
      trial.targetArea,
    );

    if (trial.showFreezeFrame && !freezeFrameElement) {
      freezeFrameElement = document.getElementById('freeze-frame');
      if (freezeFrameElement) {
        freezeFrameElement.innerHTML = `          
        <div style="text-align:center; border: 5px solid black; padding: 20px; margin: 0 auto; background-color: white; z-index: 10; max-width: 600px; border-radius: 12px;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; margin-bottom: 15px; border-radius: 50%; background-color: black; color: white; font-size: 32px; font-weight: bold;">
                i
            </div>
            <p style="text-align:center; font-size: 18px; margin: 0;">
                ${START_FIRST_TAP_INSTRUCTION(trial.keyToPress)}.
            </p>
        </div>`;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    if (trial.keyTappedEarlyFlag) {
      // eslint-disable-next-line no-param-reassign
      display_element.innerHTML = `
        <div id="status" style="margin-top: 50px;">
          <div id="error-message" style="color: red;">${KEY_TAPPED_EARLY_MESSAGE()}</div>
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

export default AgencyTappingTask;

export const agencyTappingTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
  delayLevel: number,
  showFreezeFrame: boolean,
): Trial => ({
  type: AgencyTappingTask,
  keysToHold: getHoldKeys(state),
  keyToPress: getTapKey(state),
  message: HOLD_KEYS_MESSAGE(state.getKeySettings()),
  delayOriginal: delayLevel,
  task: 'practiceAgencyTapping',
  showFreezeFrame,
  showThermometer: true,
  usePhotoDiode: state.getPhotoDiodeSettings().usePhotoDiode,
  autoIncreaseAmount() {
    return autoIncreaseAmountCalculation(
      EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
      TRIAL_DURATION,
      AUTO_DECREASE_RATE,
      AUTO_DECREASE_AMOUNT,
      state.getState().medianTaps[CalibrationPartType.CalibrationPart1],
    );
  },
  on_start(trial: Trial) {
    if (device.device) {
      sendSerialTrigger(device, {
        outsideTask: true,
        decisionTrigger: false,
        isEnd: false,
      });
    }
    sendPhotoDiodeTrigger(state.getPhotoDiodeSettings().usePhotoDiode, false);
    // This code adds the key tapped early flag to the actual task in case it was tapped too early during countdown
    const keyTappedEarlyFlag = checkFlag(
      TrialTypes.CountdownTask,
      'keyTappedEarlyFlag',
      jsPsych,
    );
    // eslint-disable-next-line no-param-reassign
    trial.keyTappedEarlyFlag = keyTappedEarlyFlag;
  },
  on_finish() {
    if (device.device) {
      sendSerialTrigger(device, {
        outsideTask: true,
        decisionTrigger: false,
        isEnd: true,
      });
    }
    sendPhotoDiodeTrigger(state.getPhotoDiodeSettings().usePhotoDiode, true);
  },
});
