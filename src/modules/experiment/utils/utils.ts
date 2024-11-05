import { JsPsych } from 'jspsych';

import { BOUNDS_DEFINITIONS } from './constants';
import {
  BoundsType,
  CalibrationPartType,
  OtherTaskStagesType,
  TaskStagesType,
} from './types';

/**
 * Generate a random number with a bias towards the mean.
 *
 * @param {number} min - The minimum value in the range.
 * @param {number} max - The maximum value in the range.
 * @param {number} skew - The skew factor to bias the distribution (default is 1).
 * @returns {number} - A random number between min and max, skewed towards the mean.
 */
export function randomNumberBm(min: number, max: number, skew = 1): number {
  let u = 0;
  let v = 0;
  // Converting [0,1) to (0,1)
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) {
    num = randomNumberBm(min, max, skew); // Resample between 0 and 1 if out of range
  } else {
    num **= skew; // Apply skew
    num *= max - min; // Stretch to fill range
    num += min; // Offset to min
  }
  return num;
}

/**
 * Calculate the auto-increase amount for each tap within the thermometer. Formula makes sure that with the median number of taps, the task is exactly completed successfully
 *
 * @param {number} EXPECTED_MAXIMUM_PERCENTAGE - The expected maximum percentage for calibration.
 * @param {number} TRIAL_DURATION - The duration of the trial.
 * @param {number} AUTO_DECREASE_RATE - The rate at which auto-decrease occurs.
 * @param {number} AUTO_DECREASE_AMOUNT - The amount by which auto-decrease occurs.
 * @returns {number} - The calculated auto-increase amount.
 */
export const autoIncreaseAmountCalculation = (
  EXPECTED_MAXIMUM_PERCENTAGE: number,
  TRIAL_DURATION: number,
  AUTO_DECREASE_RATE: number,
  AUTO_DECREASE_AMOUNT: number,
  median: number,
): number =>
  (EXPECTED_MAXIMUM_PERCENTAGE +
    (TRIAL_DURATION / AUTO_DECREASE_RATE) * AUTO_DECREASE_AMOUNT) /
  median;

/**
 * @function calculateMedianTapCount
 * @description Calculate the median tap count for a given task type and number of trials that were successful (no keys released early and key was not tapped early)
 * @param {string} taskType - The task type to filter data by
 * @param {number} numTrials - The number of trials to consider
 * @param {JsPsych} jsPsych - The jsPsych instance
 * @returns {number} - The median tap count
 */
export function calculateMedianTapCount(
  taskType: CalibrationPartType,
  numTrials: number,
  jsPsych: JsPsych,
): number {
  const filteredTrials = jsPsych.data
    .get()
    .filter({ task: taskType })
    .filter({ keysReleasedFlag: false, keyTappedEarlyFlag: false })
    .last(numTrials)
    .select('tapCount');
  const medianValue = filteredTrials.median(); // Calculate the median
  return medianValue;
}

/**
 * a function to shuffle an array
 * @param array an array to be shuffled of any type
 * @returns a shuffled array
 */
export const shuffle = <T>(array: T[]): T[] => {
  // Clone the array to avoid modifying the original array, if desired
  const arr = array.slice();

  for (let i = arr.length - 1; i > 0; i -= 1) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at i and j
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
};

/**
 * @function checkFlag
 * @description Checks if a specific flag is set in the last trial of a specified task type.
 *
 * @param {string} taskFilter - The task type to filter the data by.
 * @param {string} flag - The flag to check (e.g., 'keyTappedEarlyFlag' or 'keysReleasedFlag').
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {boolean} - Returns true if the specified flag is set; otherwise, false.
 */

export const checkFlag = (
  taskFilter: TaskStagesType,
  flag: string,
  jsPsych: JsPsych,
): boolean => {
  const lastTrialData = jsPsych.data
    .get()
    .filter({ task: taskFilter })
    .last(1)
    .values()[0];
  return lastTrialData ? lastTrialData[flag] : true;
};

/**
 * @function checkTaps
 * @description Check how many taps were made during a practice trail (to compare with the minimum)
 *
 * @param {string} taskFilter - The task type to filter the data by.
 * @param {string} flag - The flag to check (e.g., 'keyTappedEarlyFlag' or 'keysReleasedFlag').
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {boolean} - Returns true if the specified flag is set; otherwise, false.
 */

export const checkTaps = (
  taskFilter: TaskStagesType,
  jsPsych: JsPsych,
): number => {
  const lastCountdownData = jsPsych.data
    .get()
    .filter({ task: taskFilter })
    .last(1)
    .values()[0];
  return lastCountdownData ? lastCountdownData.tapCount : 0;
};

/**
 * @function checkKeys
 * @description Checks whether all keys were held down at the end of the last trial of a specified task type.
 *
 * @param {string} taskFilter - The task type to filter the data by.
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {boolean} - Returns true if all keys were held down; otherwise, false.
 */
export const checkKeys = (
  taskFilter: TaskStagesType,
  jsPsych: JsPsych,
): boolean => {
  const lastTrialData = jsPsych.data
    .get()
    .filter({ task: taskFilter })
    .last(1)
    .values()[0];
  const { keysState } = lastTrialData;
  const wereKeysHeld = Object.values(keysState).every((state) => state);
  return wereKeysHeld;
};

/**
 * @function calculateTotalReward
 * @description Calculates the total accumulated reward from successful trials. The commented out code is useful to calculate the rewards including skipped trials if random chance is implemented
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {number} - The total accumulated reward from successful trials.
 */
export function calculateTotalReward(jsPsych: JsPsych): number {
  const successfulTrials = jsPsych.data
    .get()
    .filter({ task: OtherTaskStagesType.Block, success: true });
  // If random chance is implemented, the commented out code is useful to calculate the rewards including skipped trials
  /*   const accceptedSkippedTrials = jsPsych.data
    .get()
    .filter({ task: 'block', accept: true, randomChanceAccepted: true, success: false});
    console.log(accceptedSkippedTrials)
    console.log(accceptedSkippedTrials.select('reward')); */
  return successfulTrials
    .select('reward')
    .sum() /* +accceptedSkippedTrials.select('reward').sum() */;
}

/**
 * @function changeProgressBar
 * @description Updates the progress bar and progress bar message in the jsPsych experiment.
 *
 * @param {string} name - The message to display alongside the progress bar.
 * @param {number} percent - The percentage of progress to display.
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 */
export const changeProgressBar = (
  name: string,
  percent: number,
  jsPsych: JsPsych,
): void => {
  const progressBarMessageElement = document.getElementsByTagName('span')[0];
  // eslint-disable-next-line no-param-reassign
  jsPsych.progressBar!.progress = percent;
  progressBarMessageElement!.innerText = name;
};

/**
 * @function showEndScreen
 * @description Displays an end screen with a specified message.
 *
 * @param {string} message - The message to display on the end screen.
 */
export function showEndScreen(message: string): void {
  const screen: HTMLElement = document.createElement('div');
  screen.classList.add('custom-overlay');
  screen.innerHTML = `<h2 style="text-align: center; top: 50%;">${message}</h2>`;
  document.body.appendChild(screen);
}

/**
 *  Function to sort and limit the array to max 1 item of each type
 * @param arr Array to be sorted
 */
export function sortEnumArray<T extends string>(
  arr: T[],
  sortOrder: Record<T, number>,
): T[] {
  // Use a Set to keep track of included types
  const includedTypes = new Set<T>();

  // Filter out only the first occurrence of each type
  const filteredArr = arr.filter((type) => {
    if (!includedTypes.has(type)) {
      includedTypes.add(type);
      return true;
    }
    return false;
  });
  return filteredArr.sort((a, b) => sortOrder[a] - sortOrder[b]);
}

/**
 * @function saveDataToLocalStorage
 * @description Saves the current jsPsych data to local storage.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 */
export function saveDataToLocalStorage(jsPsych: JsPsych): void {
  const jsonData = jsPsych.data.get().json();
  localStorage.setItem('jspsych-data', jsonData);
}

/**
 * Generate the actual bounds for a trial, which can have a 10% variation compared to the standard defined bounds
 * @param bounds Boundstype for which the variation is generated
 * @returns the actual bounds for a trial
 */
export const getBoundsVariation = (bounds: BoundsType): [number, number] => {
  const standardBounds = BOUNDS_DEFINITIONS[bounds];
  const difBounds = standardBounds[1] - standardBounds[0];
  const center = (standardBounds[0] + standardBounds[1]) / 2;
  const min = center - difBounds / 2 - (center - difBounds / 2) * 0.1;
  const max = center + difBounds / 2 + (center + difBounds / 2) * 0.1;
  const newCenter = randomNumberBm(min, max);
  return [newCenter - difBounds / 2, newCenter + difBounds / 2];
};

/**
 * @function getUserID
 * @description Retrieves the user ID from the jsPsych data.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {string} - The user ID as a string.
 */
export const getUserID = (jsPsych: JsPsych): string => {
  const userIdData = jsPsych.data
    .get()
    .filter({ task: 'userID' })
    .last(1)
    .values()[0];

  // Correctly extract the value from userIdData.response
  const userID = userIdData.response.UserID; // Access the 'UserID' key

  return String(userID); // Ensure it's returned as a string
};

// If random chance is implemented, this function is useful. Currently unused.
export const randomAcceptance = (): boolean => {
  const randomChance = Math.random();
  if (randomChance > 0.5) {
    return true;
  }
  return false;
};
