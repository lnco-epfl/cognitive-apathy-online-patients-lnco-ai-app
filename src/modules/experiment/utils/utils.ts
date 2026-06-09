import { Marked } from '@ts-stack/markdown';
import { JsPsych } from 'jspsych';
import { mean } from 'lodash';

import { type ExperimentState } from '../jspsych/experiment-state-class';
import {
  BOUNDS_DEFINITIONS,
  DEFAULT_BOUNDS_VARIATION,
  DELAY_CORRECTION_FACTOR,
  MINIMUM_CALIBRATION_MEDIAN,
  REWARD_DEFINITIONS,
} from './constants';
import {
  BoundsType,
  CalibrationPartType,
  OtherTaskStagesType,
  RewardType,
  TrialTypes,
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
 * Sample a delay uniformly centered around a given delay level.
 * @param {number} delayLevel - The center delay level.
 * @param {number} halfWidth - The half-width of the uniform distribution.
 * @returns {number} - A sampled delay within the specified range.
 */
export function sampleDelayUniformCentered(
  delayLevel: number,
  halfWidth: number,
): number {
  const min = Math.max(0, delayLevel - halfWidth);
  const max = delayLevel + halfWidth;
  return Math.random() * (max - min) + min;
}

export const autoIncreaseAmountCalculation = (
  EXPECTED_MAXIMUM_PERCENTAGE: number,
  TRIAL_DURATION: number,
  AUTO_DECREASE_RATE: number,
  AUTO_DECREASE_AMOUNT: number,
  median: number,
  delay: [number, number],
): number => {
  const tapsPerSecond = median / TRIAL_DURATION;
  const avgDelaySec = (delay[0] + delay[1]) / 2 / 1000;
  const lostTaps = avgDelaySec * tapsPerSecond;
  const effectivePresses = median - lostTaps;

  const isDelayCondition = delay[0] > 0 || delay[1] > 0;

  return (
    (EXPECTED_MAXIMUM_PERCENTAGE +
      (TRIAL_DURATION / AUTO_DECREASE_RATE) * AUTO_DECREASE_AMOUNT) /
    (effectivePresses * (isDelayCondition ? DELAY_CORRECTION_FACTOR : 1))
  );
};

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
  taskFilter: TrialTypes,
  flag: string,
  jsPsych: JsPsych,
): boolean => {
  const lastTrialData = jsPsych.data
    .get()
    .filter({ trial_type: taskFilter })
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

export const checkTaps = (jsPsych: JsPsych): number => {
  const lastCountdownData = jsPsych.data
    .get()
    .filter({ trial_type: TrialTypes.TappingTask })
    .last(1)
    .values()[0];
  return lastCountdownData ? lastCountdownData.tapCount : 0;
};

/**
 * @function checkMercuryHeight
 * @description Check how the height of the mercury at the end
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {boolean} - Return if the mercury was below the target the last trial
 */

export const checkMercuryHeight = (jsPsych: JsPsych): boolean => {
  const lastCountdownData = jsPsych.data
    .get()
    .filter({ trial_type: TrialTypes.TappingTask })
    .last(1)
    .values()[0];
  return lastCountdownData
    ? lastCountdownData.mercuryHeight < lastCountdownData.bounds[0]
    : false;
};

/**
 * @function checkKeys
 * @description Checks whether all keys were held down at the end of the last trial of a specified task type.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {boolean} - Returns true if all keys were held down; otherwise, false.
 */
export const checkKeys = (jsPsych: JsPsych): boolean => {
  const lastTrialData = jsPsych.data
    .get()
    .filter({ trial_type: TrialTypes.TappingTask })
    .last(1)
    .values()[0];
  const { keysState } = lastTrialData;
  const wereKeysHeld = Object.values(keysState).every((state) => state);
  return wereKeysHeld;
};

/**
 * @function checkLastTrialSuccess
 * @description Checks if the last trial was successful based on specific flags and tap counts.
 */
export const checkLastTrialSuccess = (jsPsych: JsPsych): boolean =>
  !checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych) &&
  !(
    checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych) ||
    checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych)
  ) &&
  checkTaps(jsPsych) >= MINIMUM_CALIBRATION_MEDIAN;

/**
 * @function checkLastTrialSuccess
 * @description Checks if the last trial was successful based on specific flags and tap counts.
 */
export const checkLastAgencyTrialSuccess = (jsPsych: JsPsych): boolean =>
  !checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych) &&
  !checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych) &&
  checkFlag(TrialTypes.TappingTask, 'success', jsPsych);

/**
 * @function calculateTotalReward
 * @description Calculates the total accumulated reward from successful trials. The commented out code is useful to calculate the rewards including skipped trials if random chance is implemented
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {number} - The total accumulated reward from successful trials.
 */
export function calculateTotalReward(
  jsPsych: JsPsych,
  state: ExperimentState,
): number {
  const successfulTrials = jsPsych.data
    .get()
    .filter({ task: OtherTaskStagesType.Block, success: true });
  const currentReward = successfulTrials.select('reward').sum();
  return state.getState().previousReward + currentReward;
}

/**
 * @function calculateTotalReward
 * @description Calculates the total accumulated reward from successful trials. The commented out code is useful to calculate the rewards including skipped trials if random chance is implemented
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @returns {number} - The total accumulated reward from successful trials.
 */
export function calculateTotalPoints(state: ExperimentState): number {
  const totalTrial =
    state.getTaskSettings().taskBlockRepetitions *
    state.getTaskSettings().taskBlocksIncluded.length *
    state.getTaskSettings().taskBoundsIncluded.length *
    state.getTaskSettings().taskRewardsIncluded.length *
    state.getTaskSettings().taskPermutationRepetitions;
  const averageReward = mean(
    state
      .getTaskSettings()
      .taskRewardsIncluded.map((reward) => REWARD_DEFINITIONS[reward]),
  );
  return totalTrial * averageReward;
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
export function showEndScreen(state: ExperimentState, message: string): void {
  const screen: HTMLElement = document.createElement('div');
  screen.classList.add('custom-overlay');
  if (state.getNextStepSettings().linkToNextPage) {
    const { title, description, link, linkText } = state.getNextStepSettings();
    screen.innerHTML = `<div class='sd-html'><h3>${title}</h3><p>${Marked.parse(description)}</p><a class='link-to-experiment' target="_parent" href=${link}>${linkText}</a></div>`;
  } else {
    screen.innerHTML = `<h2 style="text-align: center; top: 50%;">${message}</h2>`;
  }
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
export const getRewardYitter = (reward: RewardType): number =>
  REWARD_DEFINITIONS[reward];

/**
 * Generate the actual bounds for a trial, which can have a 10% variation compared to the standard defined bounds
 * @param bounds Boundstype for which the variation is generated
 * @returns the actual bounds for a trial
 */
export const getBoundsVariation = (bounds: BoundsType): [number, number] => {
  const standardBounds = BOUNDS_DEFINITIONS[bounds];
  const difBounds = standardBounds[1] - standardBounds[0];
  const center = (standardBounds[0] + standardBounds[1]) / 2;
  const min = center - DEFAULT_BOUNDS_VARIATION;
  const max = center + DEFAULT_BOUNDS_VARIATION;
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

// Get keys to hold down from state
export const getHoldKeys = (state: ExperimentState): string[] =>
  state.getKeySettings().preferredHand === 'left'
    ? [state.getKeySettings().rightIndex.toLowerCase()]
    : [state.getKeySettings().leftIndex.toLowerCase()];

// Get Tapping Key
export const getTapKey = (state: ExperimentState): string =>
  state.getKeySettings().preferredHand === 'left'
    ? state.getKeySettings().leftIndex.toLowerCase()
    : state.getKeySettings().rightIndex.toLowerCase();

export const resolveLink = (link: string, participantName: string): string =>
  link.includes('{id}') ? link.replace('{id}', participantName) : link;

export const getProgressBarStatus = (
  state: ExperimentState,
  trialBlock?: number,
): number => {
  switch (state.getState().phase) {
    case 'practice':
      return 0.05;
    case 'calibration':
      return 0.1;
    case 'validation':
      return 0.15;
    case 'EBDM':
      if (trialBlock) {
        return (
          0.2 +
          (trialBlock /
            (state.getTaskSettings().taskBlockRepetitions *
              state.getTaskSettings().taskBlocksIncluded.length)) *
            0.9
        );
      }
      return 0.15;
    case 'final-calibration':
      return 0.9;
    default:
      return 0;
  }
};
