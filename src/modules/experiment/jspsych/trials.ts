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
  BREAK_MESSAGE,
  BREAK_TIME,
  CONTINUE_BUTTON_MESSAGE,
  CURRENCY,
  DELAY_DEFINITIONS,
  DEMO_TRIAL_MESSAGE,
  DEMO_TRIAL_SET,
  ENABLE_BUTTON_AFTER_TIME,
  EXPECTED_MAXIMUM_PERCENTAGE,
  MAIN_TASK_BREAK_DURATION,
  PROGRESS_BAR,
  REWARD_TOTAL_MESSAGE,
  SKIP_BUTTON,
  SKIP_MESSAGE,
  TOTAL_REWARD_MONEY,
  TRIAL_DURATION,
  TRYING_AGAIN_LABEL,
  TRY_AGAIN_BUTTON,
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
  TrialTypes,
} from '../utils/types';
import {
  autoIncreaseAmountCalculation,
  calculateTotalPoints,
  calculateTotalReward,
  changeProgressBar,
  checkFlag,
  checkKeys,
  getBoundsVariation,
  getHoldKeys,
  getProgressBarStatus,
  getRewardYitter,
  getTapKey,
  saveDataToLocalStorage,
  shuffle,
} from '../utils/utils';
import { ExperimentState } from './experiment-state-class';
import { likertIntro, likertIntroDemo } from './message-trials';
import {
  acceptanceThermometer,
  rememberDirectionContent,
  renderConnectionWarning,
} from './stimulus';

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
  ...(!randomSkip ? [countdownStep(state)] : []),
  {
    type: TappingTask,
    keysToHold() {
      return getHoldKeys(state);
    },
    keyToPress() {
      return getTapKey(state);
    },
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
          checkFlag(TrialTypes.AcceptTask, 'accepted', jsPsych);
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

      sendPhotoDiodeTrigger(state.getPhotoDiodeSettings().usePhotoDiode, true);

      const keyTappedEarlyFlag = checkFlag(
        TrialTypes.CountdownTask,
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

      sendPhotoDiodeTrigger(state.getPhotoDiodeSettings().usePhotoDiode, true);

      // eslint-disable-next-line no-param-reassign
      data.medianTaps = {
        calibrationPart1Median: state.getState().medianTaps.calibrationPart1,
        calibrationPart2Median: state.getState().medianTaps.calibrationPart2,
      };
      saveDataToLocalStorage(jsPsych);

      updateData(jsPsych.data.get());
    },
  },
  {
    timeline: [releaseKeysStep(state)],
    conditional_function() {
      return checkKeys(jsPsych) && !randomSkip;
    },
  },
  ...(demo ? [] : [successScreen(jsPsych)]),
  ...(demo
    ? [loadingBarTrial(true, jsPsych)]
    : [
        {
          timeline: [loadingBarTrial(false, jsPsych)],
          conditional_function: () =>
            !checkFlag(TrialTypes.AcceptTask, 'accepted', jsPsych) ||
            randomSkip, // Use trialData.accepted in the conditional function
        },
        {
          timeline: [loadingBarTrial(true, jsPsych)],
          conditional_function: () =>
            checkFlag(TrialTypes.AcceptTask, 'accepted', jsPsych) &&
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
      `<p>${DEMO_TRIAL_MESSAGE(state.getTaskSettings().taskBoundsIncluded.length > 3 ? 3 : state.getTaskSettings().taskBoundsIncluded.length, getNumTrialsPerBlock(state), state.getKeySettings())}</p>`,
    choices: [CONTINUE_BUTTON_MESSAGE()],
  },
  ...DEMO_TRIAL_SET.map((taskBounds: BoundsType) => ({
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
        checkFlag(TrialTypes.CountdownTask, 'keyTappedEarlyFlag', jsPsych) ||
        checkFlag(TrialTypes.TappingTask, 'keysReleasedFlag', jsPsych)
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
      const actualReward = getRewardYitter(reward);
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
              state.getPhotoDiodeSettings().usePhotoDiode,
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
              state.getPhotoDiodeSettings().usePhotoDiode,
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
            return checkFlag(TrialTypes.AcceptTask, 'accepted', jsPsych);
          },
        },
        {
          timeline: [loadingBarTrial(false, jsPsych)],
          conditional_function() {
            return !checkFlag(TrialTypes.AcceptTask, 'accepted', jsPsych);
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
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus() {
    // TODO: Add Currency and Total Reward as configuration
    const totalSuccessfulReward = calculateTotalReward(jsPsych, state);
    const totalPoints = calculateTotalPoints(state);
    const totalMoney = TOTAL_REWARD_MONEY; // connection to state
    const currentRewardMoney = (
      (totalSuccessfulReward / totalPoints) *
      totalMoney
    ).toFixed(2);
    return `<p>${REWARD_TOTAL_MESSAGE(totalSuccessfulReward.toFixed(0), currentRewardMoney, CURRENCY)}</p>`;
  },
  data: {
    task: 'display_reward',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on_finish(data: any) {
    const totalSuccessfulReward = calculateTotalReward(jsPsych, state);
    // eslint-disable-next-line no-param-reassign
    data.totalReward = totalSuccessfulReward;
    state.incrementCompletedBlocks();
  },
});

export const createBreakTrial = (
  state: ExperimentState,
  index: number,
  updateData: (data: DataCollection) => void,
  jsPsych: JsPsych,
): Trial => {
  const breakDuration = MAIN_TASK_BREAK_DURATION;
  const allowSkip = index % 2 === 0;

  let remaining = breakDuration / 1000;

  const renderStimulus = (): string => `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <h2>${BREAK_TIME()}</h2>
      <p>${BREAK_MESSAGE(remaining.toFixed(0))}</p>
      ${allowSkip ? `<p>${SKIP_MESSAGE()}</p>` : ''}
      ${renderConnectionWarning(state)}
    </div>
  `;

  return {
    type: htmlButtonResponse,
    stimulus: renderStimulus(),
    choices: allowSkip ? [SKIP_BUTTON()] : [],
    trial_duration: breakDuration,
    on_start() {
      const interval = setInterval(() => {
        remaining -= 1;
        const container = document.querySelector('.jspsych-content');
        if (container) container.innerHTML = renderStimulus();
        if (remaining <= 0) clearInterval(interval);
      }, 1000);

      document.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.id === 'try-again-btn') {
          target.innerText = TRYING_AGAIN_LABEL();
          target.disabled = true;
          updateData(jsPsych.data.get());
          setTimeout(() => {
            if (state.getPatchStatus() === 'failed') {
              target.disabled = false;
              target.innerText = TRY_AGAIN_BUTTON();
            }
          }, 5000);
        }
      });
    },
    on_finish() {
      // clear interval if still running
      remaining = 0;
    },
  };
};

/**
 * Simple Trial to at the beginning of the actual experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const rememberEffortRewardTrialDirection = (): Trial => ({
  type: htmlButtonResponse,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [rememberDirectionContent()],
  enable_button_after: ENABLE_BUTTON_AFTER_TIME,
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
): Trial => ({
  timeline: [
    {
      timeline: createTaskBlockDemo(jsPsych, state, delay, updateData, device),
      on_timeline_start() {
        changeProgressBar(
          `${PROGRESS_BAR().PROGRESS_BAR_TRIAL_BLOCKS} ${index + 1}`,
          getProgressBarStatus(state, index),
          jsPsych,
        );
      },
    },
    { ...rememberEffortRewardTrialDirection() },
    {
      timeline: createTaskBlockTrials(
        jsPsych,
        state,
        delay,
        updateData,
        device,
      ),
    },
    {
      // Likert scale survey after block
      timeline: [
        likertIntro(),
        ...likertQuestions2Randomized(jsPsych),
        ...likertFinalQuestion(),
      ],
    },
    {
      ...createRewardDisplayTrial(jsPsych, state),
      on_start() {
        updateData(jsPsych.data.get());
        saveDataToLocalStorage(jsPsych);
      },
    },
    {
      timeline: [createBreakTrial(state, index, updateData, jsPsych)],
      on_timeline_start() {
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.checkpoint = state.getState().phase;
          lastTrial.checkpointBlock = index + 1; // Add the block number too
        }
        updateData(jsPsych.data.get());
        saveDataToLocalStorage(jsPsych);
      },
    },
  ],
  on_timeline_finish() {
    updateData(jsPsych.data.get());
  },
});

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
