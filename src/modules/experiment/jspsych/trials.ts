import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import { DataCollection, JsPsych } from 'jspsych';

// Assuming you have the appropriate types defined here
import { countdownStep } from '../trials/countdown-trial';
import {
  likertFinalQuestion,
  likertQuestions1,
  likertQuestions2Randomized,
} from '../trials/likert-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import { successScreen } from '../trials/success-trial';
import TappingTask from '../trials/tapping-task-trial';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  BOUNDS_DEFINITIONS,
  CONTINUE_BUTTON_MESSAGE,
  DELAY_DEFINITIONS,
  DEMO_TRIAL_MESSAGE,
  EXPECTED_MAXIMUM_PERCENTAGE,
  FAILED_MINIMUM_DEMO_TAPS_DURATION,
  FAILED_MINIMUM_DEMO_TAPS_MESSAGE,
  MINIMUM_DEMO_TAPS,
  PROGRESS_BAR,
  REWARD_DEFINITIONS,
  REWARD_TOTAL_MESSAGE,
  TRIAL_DURATION,
} from '../utils/constants';
import {
  BoundsType,
  DelayType,
  OtherTaskStagesType,
  RewardType,
  TaskTrialData,
  Timeline,
  Trial,
  TrialSettingsType,
} from '../utils/types';
import {
  autoIncreaseAmountCalculation,
  calculateTotalReward,
  changeProgressBar,
  checkFlag,
  checkKeys,
  getBoundsVariation,
  /* randomAcceptance */
  saveDataToLocalStorage,
  shuffle,
} from '../utils/utils';
import { ExperimentState } from './experiment-state-class';
import { likertIntro, likertIntroDemo } from './message-trials';
import { acceptanceThermometer } from './stimulus';

/**
 * @const failedMinimumDemoTapsTrial
 * @description A jsPsych trial that displays a failure message when the participant fails to reach the minimum number of taps during a demo trial.
 *
 * This trial includes:
 * - Displaying a red-colored failure message to the participant.
 * - Automatically ending the trial after a specified duration without requiring any key press.
 *
 * @property {string} type - The plugin used for this trial (`HtmlKeyboardResponsePlugin`).
 * @property {string} stimulus - The failure message displayed to the participant.
 * @property {Array} choices - Specifies that no keys are allowed during this trial.
 * @property {number} trial_duration - The duration for which the failure message is displayed, in milliseconds.
 */
const failedMinimumDemoTapsTrial = (): Trial => ({
  type: HtmlKeyboardResponsePlugin,
  stimulus: `<p style="color: red;">${FAILED_MINIMUM_DEMO_TAPS_MESSAGE}</p>`,
  choices: ['NO_KEYS'],
  trial_duration: FAILED_MINIMUM_DEMO_TAPS_DURATION,
});

const getNumTrialsPerBlock = (state: ExperimentState): number =>
  state.getTaskSettings().taskPermutationRepetitions *
  state.getTaskSettings().taskBoundsIncluded.length *
  state.getTaskSettings().taskRewardsIncluded.length;

/**
 * Generate a single Trial (demo or real) for a trial block
 * @param jsPsych experiment context
 * @param state experiment state
 * @param delay delay used in the trial block
 * @param bounds bounds for the trial block
 * @param reward reward for the trial block
 * @param demo boolean to say if the trial block is a demo (no reward and require a minimum number of taps)
 * @returns a timeline of trials for a single experiment trial
 */
const generateTaskTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  trialSettings: TrialSettingsType,
  blockType: DelayType,
  demo: boolean,
  randomSkip: boolean,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
  bounds: BoundsType,
  reward?: RewardType,
): Timeline => [
  ...(!randomSkip ? [countdownStep()] : []),
  {
    type: TappingTask,
    task: demo ? OtherTaskStagesType.Demo : OtherTaskStagesType.Block,
    duration: TRIAL_DURATION,
    showThermometer: true,
    randomDelay: trialSettings.delay,
    bounds: trialSettings.bounds,
    reward: trialSettings.reward,
    randomChanceAccepted: randomSkip,
    autoIncreaseAmount() {
      return autoIncreaseAmountCalculation(
        EXPECTED_MAXIMUM_PERCENTAGE,
        TRIAL_DURATION,
        AUTO_DECREASE_RATE,
        AUTO_DECREASE_AMOUNT,
        state.getState().medianTaps.calibrationPart2,
      );
    },
    data: {
      blockType,
      task: demo ? OtherTaskStagesType.Demo : OtherTaskStagesType.Block,
      randomDelay: trialSettings.delay,
      bounds: trialSettings.bounds,
      reward: trialSettings.reward,
      accept() {
        if (!demo) {
          checkFlag(OtherTaskStagesType.Accept, 'accepted', jsPsych);
        }
      },
    },
    on_start(data: TaskTrialData) {
      if (device.device) {
        sendSerialTrigger(device, {
          outsideTask: demo,
          decisionTrigger: false,
          delayedCondition: blockType === DelayType.WideAsync,
          bounds,
          reward: demo ? undefined : reward,
          isEnd: false,
        });
      }
      sendPhotoDiodeTrigger(state.getGeneralSettings().usePhotoDiode, true);
      const keyTappedEarlyFlag = checkFlag(
        OtherTaskStagesType.Countdown,
        'keyTappedEarlyFlag',
        jsPsych,
      );
      // Update the trial parameters with keyTappedEarlyFlag
      // eslint-disable-next-line no-param-reassign
      data.keyTappedEarlyFlag = keyTappedEarlyFlag;
    },
    on_finish(data: TaskTrialData) {
      if (device.device) {
        sendSerialTrigger(device, {
          outsideTask: demo,
          decisionTrigger: false,
          delayedCondition: blockType === DelayType.WideAsync,
          bounds,
          reward,
          isEnd: true,
        });
      }
      sendPhotoDiodeTrigger(state.getGeneralSettings().usePhotoDiode, true);
      if (demo) {
        // eslint-disable-next-line no-param-reassign
        data.minimumTapsReached = data.tapCount > MINIMUM_DEMO_TAPS;
        if (
          !data.keysReleasedFlag &&
          data.minimumTapsReached &&
          !data.keyTappedEarlyFlag
        ) {
          state.incrementDemoTrialSuccesses();
        }
      } else {
        // eslint-disable-next-line no-param-reassign
        data.medianTaps = {
          calibrationPart1Median: state.getState().medianTaps.calibrationPart1,
          calibrationPart2Median: state.getState().medianTaps.calibrationPart2,
        };
        saveDataToLocalStorage(jsPsych);
      }
      updateData(jsPsych.data.get());
    },
  },
  {
    timeline: [releaseKeysStep()],
    conditional_function() {
      return (
        checkKeys(
          demo ? OtherTaskStagesType.Demo : OtherTaskStagesType.Block,
          jsPsych,
        ) && !randomSkip
      );
    },
  },
  ...(demo
    ? [
        {
          timeline: [failedMinimumDemoTapsTrial()],
          conditional_function() {
            return (
              !checkFlag(
                OtherTaskStagesType.Demo,
                'minimumTapsReached',
                jsPsych,
              ) &&
              !checkFlag(
                OtherTaskStagesType.Demo,
                'keyTappedEarlyFlag',
                jsPsych,
              ) &&
              !checkFlag(OtherTaskStagesType.Demo, 'keysReleasedFlag', jsPsych)
            );
          },
        },
      ]
    : [successScreen(jsPsych, OtherTaskStagesType.Block)]),
  ...(demo
    ? [loadingBarTrial(true, jsPsych)]
    : [
        {
          timeline: [loadingBarTrial(false, jsPsych)],
          conditional_function: () =>
            !checkFlag(OtherTaskStagesType.Accept, 'accepted', jsPsych) ||
            randomSkip, // Use trialData.accepted in the conditional function
        },
        {
          timeline: [loadingBarTrial(true, jsPsych)],
          conditional_function: () =>
            checkFlag(OtherTaskStagesType.Accept, 'accepted', jsPsych) &&
            !randomSkip, // Use trialData.accepted in the conditional function
        },
      ]),
];

/**
 * Create the demo that is performed to familiarize subjects with the delay before a trial block
 * @param jsPsych the experiment
 * @param state the experiment state
 * @param delay the delay of the trial block
 * @returns the timeline with jspsych trials for the demo part
 */
export const createTaskBlockDemo = (
  jsPsych: JsPsych,
  state: ExperimentState,
  delay: DelayType,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => [
  {
    type: htmlButtonResponse,
    stimulus: () =>
      `<p>${DEMO_TRIAL_MESSAGE(state.getTaskSettings().taskBoundsIncluded.length, getNumTrialsPerBlock(state))}</p>`,
    choices: [CONTINUE_BUTTON_MESSAGE],
    on_start() {
      state.resetDemoTrialSuccesses(); // Reset demo successes before starting
    },
  },
  ...state
    .getTaskSettings()
    .taskBoundsIncluded.map((taskBounds: BoundsType) => ({
      timeline: generateTaskTrial(
        jsPsych,
        state,
        {
          bounds: BOUNDS_DEFINITIONS[taskBounds],
          reward: 0,
          delay: DELAY_DEFINITIONS[delay],
        },
        delay,
        true,
        false,
        updateData,
        device,
        taskBounds,
      ),
      loop_function() {
        return (
          checkFlag(OtherTaskStagesType.Demo, 'keyTappedEarlyFlag', jsPsych) ||
          checkFlag(OtherTaskStagesType.Demo, 'keysReleasedFlag', jsPsych) ||
          !checkFlag(OtherTaskStagesType.Demo, 'minimumTapsReached', jsPsych)
        );
      },
    })),
  // Likert scale survey after demo
  likertIntroDemo(),
  ...likertQuestions1(),
];

/**
 * Create the core trials for a specific task block in the following way:
 *  1. Generate an array with all possible permutations of bounds and rewards
 *  2. Shuffle that array
 *  3. Repeat this process for the number of repetitions per permutation (taskBlockRepetitions setting)
 *  4. For each (bounds, reward) combination, create a Trial block including thermometer and main task
 * @param jsPsych
 * @param state
 * @param delay
 * @returns
 */
export const createTaskBlockTrials = (
  jsPsych: JsPsych,
  state: ExperimentState,
  delay: DelayType,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => [
  // Inline code that for the number of repetitions as set in the settings shuffles all possible permutations randomly and then creates a trial block for each
  Array.from(
    { length: state.getTaskSettings().taskPermutationRepetitions },
    () =>
      shuffle(
        state.getTaskSettings().taskBoundsIncluded.flatMap((a) =>
          state.getTaskSettings().taskRewardsIncluded.map((b) => ({
            bounds: a,
            reward: b,
          })),
        ),
      ),
  )
    .flat()
    .map(({ bounds, reward }) => {
      const actualReward =
        REWARD_DEFINITIONS[reward][
          Math.floor(Math.random() * REWARD_DEFINITIONS[reward].length)
        ];
      const actualBounds = getBoundsVariation(bounds);
      const actualDelay = DELAY_DEFINITIONS[delay];
      const randomSkip =
        Math.random() <= state.getTaskSettings().randomSkipChance / 100;
      return [
        {
          type: HtmlKeyboardResponsePlugin,
          stimulus() {
            return `${acceptanceThermometer(actualBounds, actualReward)}`;
          },
          choices: ['arrowright', 'arrowleft'],
          data: {
            task: OtherTaskStagesType.Accept,
            reward: actualReward,
            bounds: actualBounds,
            originalBounds: BOUNDS_DEFINITIONS[bounds],
            delay: actualDelay,
          },
          on_start: () => {
            if (device.device) {
              sendSerialTrigger(device, {
                outsideTask: false,
                decisionTrigger: true,
                delayedCondition: delay === DelayType.WideAsync,
                bounds,
                reward,
                isEnd: false,
              });
            }
            sendPhotoDiodeTrigger(
              state.getGeneralSettings().usePhotoDiode,
              false,
            );
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          on_finish: (data: any) => {
            if (device.device) {
              sendSerialTrigger(device, {
                outsideTask: false,
                decisionTrigger: true,
                delayedCondition: delay === DelayType.WideAsync,
                bounds,
                reward,
                isEnd: true,
              });
            }
            sendPhotoDiodeTrigger(
              state.getGeneralSettings().usePhotoDiode,
              true,
            );
            // eslint-disable-next-line no-param-reassign
            data.accepted = data.response === 'ArrowRight';
          },
        },
        {
          timeline: generateTaskTrial(
            jsPsych,
            state,
            { delay: actualDelay, bounds: actualBounds, reward: actualReward },
            delay,
            false,
            randomSkip,
            updateData,
            device,
            bounds,
            reward,
          ),
          conditional_function() {
            return checkFlag(OtherTaskStagesType.Accept, 'accepted', jsPsych);
          },
        },
        {
          timeline: [loadingBarTrial(false, jsPsych)],
          conditional_function() {
            return !checkFlag(OtherTaskStagesType.Accept, 'accepted', jsPsych);
          },
        },
      ];
    }),
];

/**
 * @function createRewardDisplayTrial
 * @description Creates a trial that displays the accumulated reward to the participant after completing a block of trials.
 *
 * This function includes:
 * - Calculating the total reward based on the participant's performance across trials.
 * - Displaying the reward to the participant in a message.
 * - Allowing the participant to proceed by clicking a button.
 * - Incrementing the count of completed blocks in the state object (for the sake of the progress bar control)
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {Object} state - An object for storing and tracking state data during the trials.
 *
 * @returns {Object} - A jsPsych trial object that displays the accumulated reward and allows the participant to proceed.
 */
export const createRewardDisplayTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE],
  stimulus() {
    const totalSuccessfulReward = calculateTotalReward(jsPsych);
    return `<p>${REWARD_TOTAL_MESSAGE(totalSuccessfulReward.toFixed(0))}</p>`;
  },
  data: {
    task: 'display_reward',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on_finish(data: any) {
    const totalSuccessfulReward = calculateTotalReward(jsPsych);
    // eslint-disable-next-line no-param-reassign
    data.totalReward = totalSuccessfulReward;
    state.incrementCompletedBlocks();
  },
});

/**
 * Generate a complete Trial Block for a specific delay by generating a demo block, the actual trials, the lickert questions and finally the reward display
 * @param jsPsych experiment context
 * @param state experiment state
 * @param delay delay for this trial block
 * @returns complete timeline with all the jspsych trials for this block
 */
export const generateTaskTrialBlock = (
  jsPsych: JsPsych,
  state: ExperimentState,
  delay: DelayType,
  index: number,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => [
  {
    timeline: createTaskBlockDemo(jsPsych, state, delay, updateData, device),
    on_timeline_start() {
      changeProgressBar(
        `${PROGRESS_BAR.PROGRESS_BAR_CALIBRATION} ${index + 1}`,
        state.getProgressBarStatus('block', index),
        jsPsych,
      );
    },
  },
  {
    timeline: createTaskBlockTrials(jsPsych, state, delay, updateData, device),
  },
  {
    // Likert scale survey after block
    timeline: [
      likertIntro(),
      ...likertQuestions2Randomized(jsPsych),
      ...likertFinalQuestion(),
    ],
  },
  createRewardDisplayTrial(jsPsych, state),
];

/**
 * @function generateTrialOrder
 * @description Generates a fallback timeline node that randomly samples trial blocks in cases where the user ID
 * does not match any of the predefined trial orders. This ensures that the experiment can continue even if the
 * user ID is not recognized.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to control the experiment's flow.
 * @param {State} state - An object for storing and tracking state data during the trials.
 *
 * @returns {Object} - A timeline node that samples random trials if no matching user ID is found.
 */
export const generateTrialOrder = (state: ExperimentState): DelayType[] => {
  const randomizedTrialBlock: DelayType[] = [];
  for (let i = 0; i < state.getTaskSettings().taskBlockRepetitions; i += 1) {
    randomizedTrialBlock.push(
      ...shuffle([...state.getTaskSettings().taskBlocksIncluded]),
    );
  }
  return randomizedTrialBlock;
};
