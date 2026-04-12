// eslint-disable-next-line import/no-cycle
import { type KeySettings } from '@/modules/context/SettingsContext';

import { type ExperimentState } from '../jspsych/experiment-state-class';
import i18n from '../jspsych/i18n';
import {
  BoundsType,
  DelayType,
  ExtendedKeySettings,
  InstructionIDs,
  RewardType,
} from './types';

export const LOADING_BAR_SPEED_NO = 50;
export const LOADING_BAR_SPEED_YES = 5;

export const AUTO_DECREASE_AMOUNT = 2;
export const AUTO_DECREASE_RATE = 100;
export const AUTO_INCREASE_AMOUNT = 10;
export const MAXIMUM_THERMOMETER_HEIGHT = 100;
export const EXPECTED_MAXIMUM_PERCENTAGE = 100;
export const NUM_TAPS_WITHOUT_DELAY = 5;
export const NUM_TAPS_AGENCY_WITHOUT_DELAY = 1;

export const DELAY_DEFINITIONS: { [key in DelayType]: [number, number] } = {
  [DelayType.Sync]: [0, 0],
  [DelayType.NarrowAsync]: [400, 600],
  [DelayType.WideAsync]: [0, 1000],
};

export const BOUNDS_DEFINITIONS: { [key in BoundsType]: [number, number] } = {
  [BoundsType.Easy]: [5, 25],
  [BoundsType.EasyMedium]: [28, 48],
  [BoundsType.Medium]: [52, 72],
  // [BoundsType.MediumHard]: [59, 77],
  [BoundsType.Hard]: [75, 95],
};

export const REWARD_DEFINITIONS: {
  [key in RewardType]: number;
} = {
  [RewardType.Low]: 1,
  [RewardType.LowMiddle]: 5,
  [RewardType.Middle]: 10,
  // [RewardType.MiddleHigh]: 20,
  [RewardType.High]: 20,
};

export const DEFAULT_REWARD_YITTER = 0.5;
export const DEFAULT_BOUNDS_VARIATION = 3;
export const TOTAL_REWARD_MONEY = 6;
export const CURRENCY = 'EUR';

export const MAX_PRACTICE_LOOP_RETRIES = 2;
export const HOLD_KEY_PRACTICE_DURATION = 5; // seconds
export const HOLD_KEY_MIN_SUCCESSES = 2;
export const HOLD_KEY_MAX_FAILURES = 3;

export const CALIBRATION_DEFAULT_SEED_TAPS = 20;

export const NUM_CALIBRATION_WITHOUT_FEEDBACK_TRIALS = 4; // 4 default
export const NUM_CALIBRATION_WITH_FEEDBACK_TRIALS = 3; // 3 default
export const NUM_CALIBRATION_TRIALS =
  NUM_CALIBRATION_WITHOUT_FEEDBACK_TRIALS +
  NUM_CALIBRATION_WITH_FEEDBACK_TRIALS;

export const NUM_FINAL_CALIBRATION_TRIALS_PART_1 = 3; // 3 default
export const NUM_FINAL_CALIBRATION_TRIALS_PART_2 = 3; // 3 default

export const MINIMUM_CALIBRATION_MEDIAN = 10;
export const EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION = 50;

export const PERCENTAGE_VALIDATION_TRIALS_SUCCESSFUL = 0.75;
export const NUM_VALIDATION_TRIALS = 4; // 4 default
export const NUM_EXTRA_VALIDATION_TRIALS = 3; // 3 default

export const NUM_DEMO_TRIALS = 3; // 3 default
export const MINIMUM_DEMO_TAPS = 5; // 5 default
export const FAILED_MINIMUM_DEMO_TAPS_DURATION = 3000;

export const TRIAL_DURATION = 5000; // 5000 updated for patient version

export const GO_DURATION = 500;
export const SUCCESS_SCREEN_DURATION = 1000;
export const SUCCESS_SCREEN_DURATION_FREEZE_FRAME = 5000;
export const REHOLD_TIMEOUT = 500;
export const COUNTDOWN_TIME = 2;
export const PREMATURE_KEY_RELEASE_ERROR_TIME = 1000;
export const KEY_TAPPED_EARLY_ERROR_TIME = 3000;
export const KEYBOARD_LAYOUT = '';
export const PATIENT_SAFETY_MARGIN = 3;
export const AGENCY_TAPPING_SAFETY_MARGIN = 10;
export const UPDATE_MEDIAN_TAPS_THRESHOLD = 2;
export const MAX_VALIDATION_FAILURES = 7;
export const MAX_VALIDATION_ATTEMPTS_PER_LEVEL = 3;
export const MAX_EXTRA_VALIDATION_ATTEMPTS = 3;
export const ENABLE_BUTTON_AFTER_TIME = 15000; // default is 15000 ms

export const ACCEPT_OFFER_BUTTON = 'arrowright';
export const DECLINE_OFFER_BUTTON = 'arrowleft';
export const POINT_VALUE = 0.01;
export const DEMO_TRIAL_SET = [BoundsType.Medium, BoundsType.Hard];
export const NUMBER_OF_DEMO_TRIALS = DEMO_TRIAL_SET.length;
export const MAIN_TASK_BREAK_DURATION = 30000; // 30 seconds

// --------------------------------
// Agency Tapping Task Constants
// --------------------------------
export const REQUIRED_TIME_IN_BOUNDS = 2000;
export const DEFAULT_BOUNDS = [50, 80];
export const TASK_COMPLETION_BREAK_DURATION = 60000;
export const HALF_WIDTH_AGENCY_DELAY = 25;
export const AGENCY_MIN_TAPS = 7;
export const AGENCY_MAX_TAPS = 16;

// --------------------------------
// Helper functions for keyboard instructions
// --------------------------------
export const toName = (key: string): string => {
  switch (key.toLowerCase()) {
    case ' ':
      return 'Spacebar';
    case 'arrowright':
      return 'Right Arrow';
    case 'arrowleft':
      return 'Left Arrow';
    case 'arrowup':
      return 'Up Arrow';
    case 'arrowdown':
      return 'Down Arrow';
    default:
      return key.toUpperCase();
  }
};

export const customKeyOrder = [
  'leftPink',
  'leftRing',
  'leftMiddle',
  'leftThumb',
  'rightIndex',
  'leftIndex',
];

export const LEFT_INDEX = (): string => i18n.t('LEFT_INDEX');
export const RIGHT_INDEX = (): string => i18n.t('RIGHT_INDEX');

export const TAP_ON_GO_INSTRUCTION = (keySettings: KeySettings): string =>
  i18n.t('TAP_ON_GO_INSTRUCTION', {
    KEY_TO_PRESS: keySettings.leftIndex,
  });

export const KEY_INSTRUCTIONS = (
  keySettings: ExtendedKeySettings,
): string[] => [
  i18n.t('HOLD_KEY_INSTRUCTION', {
    KEY_REPLACE:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.rightIndex)
        : toName(keySettings.leftIndex),
    HOLD_FINGER:
      keySettings.preferredHand === 'left' ? RIGHT_INDEX() : LEFT_INDEX(),
  }),
  i18n.t('TAP_ON_GO_INSTRUCTION', {
    KEY_TO_PRESS:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
    TAP_FINGER:
      keySettings.preferredHand === 'left' ? LEFT_INDEX() : RIGHT_INDEX(),
  }),
];

export const LOST_CONNECTION_WARNING_MESSAGE = (): string =>
  i18n.t('LOST_CONNECTION_WARNING');

export const TRY_AGAIN_BUTTON = (): string => i18n.t('TRY_AGAIN');
export const TRYING_AGAIN_LABEL = (): string => i18n.t('TRYING_AGAIN_LABEL');

export const WARNING_MESSAGES_INSTRUCTION = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('WARNING_MESSAGES_INSTRUCTION', {
    TAP_KEY_REPLACE:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
    HOLD_KEYS_REPLACE: `<b>${toName(keySettings.preferredHand === 'left' ? keySettings.rightIndex : keySettings.leftIndex)}</b>`,
    TAP_FINGER:
      keySettings.preferredHand === 'left' ? LEFT_INDEX() : RIGHT_INDEX(),
  });

export const KEY_INSTRUCTIONS_LIST = (
  keySettings: ExtendedKeySettings,
): string =>
  `<ul>${Object.values(KEY_INSTRUCTIONS(keySettings))
    .map((instruction) => `<li>${instruction}</li>`)
    .join('')}</ul>`;

export const TAPPING_TASK_INSTRUCTIONS = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('TAPPING_TASK_INSTRUCTIONS', {
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
    TAP_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.leftIndex
        : keySettings.rightIndex,
    ),
    HOLD_FINGER:
      keySettings.preferredHand === 'left' ? RIGHT_INDEX() : LEFT_INDEX(),
    TAP_FINGER:
      keySettings.preferredHand === 'left' ? LEFT_INDEX() : RIGHT_INDEX(),
  });

// --------------------------------
// Helper functions for introduction part
// --------------------------------

export const EXPERIMENT_SETUP_HEADER = (): string =>
  i18n.t('EXPERIMENT_SETUP_HEADER');

export const SIT_COMFORTABLY_MESSAGE = (): string =>
  i18n.t('SIT_COMFORTABLY_MESSAGE');

export const INTRODUCTION_HEADER = (): string => i18n.t('INTRODUCTION_HEADER');

export const CLICK_BUTTON_TO_PROCEED_MESSAGE = (): string =>
  i18n.t('CLICK_BUTTON_TO_PROCEED_MESSAGE');

export const CONTINUE_MESSAGE_TITLE = (): string =>
  i18n.t('CONTINUE_MESSAGE_TITLE');

export const CONTINUE_BUTTON_MESSAGE = (): string =>
  i18n.t('CONTINUE_BUTTON_MESSAGE');
export const START_BUTTON_MESSAGE = (): string =>
  i18n.t('START_BUTTON_MESSAGE');
export const FINISH_BUTTON_MESSAGE = (): string =>
  i18n.t('FINISH_BUTTON_MESSAGE');
export const DOMINANT_HAND_MESSAGE = (): string =>
  i18n.t('DOMINANT_HAND_MESSAGE');

export const LEFT_HAND_BUTTON = (): string => i18n.t('LEFT_HAND_BUTTON');
export const RIGHT_HAND_BUTTON = (): string => i18n.t('RIGHT_HAND_BUTTON');

// --------------------------------
// Helper functions for practice part
// --------------------------------
export const TUTORIAL_HEADER = (): string => i18n.t('TUTORIAL_HEADER');

export const TUTORIAL_INTRODUCTION_MESSAGE = (): string =>
  i18n.t('TUTORIAL_INTRODUCTION_MESSAGE');

export const CONTINUE_TAPPING_MESSAGE = (): string =>
  i18n.t('CONTINUE_TAPPING_MESSAGE');

export const TAP_PROMPT_MESSAGE = (keySettings: ExtendedKeySettings): string =>
  i18n.t('TAP_PROMPT_MESSAGE', {
    TAP_KEY: toName(
      keySettings.preferredHand?.toLowerCase() === 'right'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
  });

export const PHASE_5_INSTRUCTION = (keySettings: ExtendedKeySettings): string =>
  i18n.t('PHASE_5_INSTRUCTION', {
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
    HOLD_FINGER:
      keySettings.preferredHand === 'left' ? RIGHT_INDEX() : LEFT_INDEX(),
  });

export const HOLD_S_PROMPT_MESSAGE = (holdKey: string): string =>
  i18n.t('HOLD_S_PROMPT_MESSAGE', { HOLD_KEY: toName(holdKey) });

export const HOLD_S_RELEASE_PROMPT = (holdKey: string): string =>
  i18n.t('HOLD_S_RELEASE_PROMPT', { HOLD_KEY: toName(holdKey) });

export const HOLD_S_SUCCESS_MESSAGE = (): string =>
  i18n.t('HOLD_S_SUCCESS_MESSAGE');

export const HOLD_S_RETRY_MESSAGE = (holdKey: string): string =>
  i18n.t('HOLD_S_RETRY_MESSAGE', { HOLD_KEY: toName(holdKey) });

export const HOLD_S_PRACTICE_COMPLETE_MESSAGE = (): string =>
  i18n.t('HOLD_S_PRACTICE_COMPLETE_MESSAGE');

export const HOLD_S_PRACTICE_CONTINUE_MESSAGE = (): string =>
  i18n.t('HOLD_S_PRACTICE_CONTINUE_MESSAGE');

export const TAPPING_INSTRUCTIONS_PAGES = (
  keySettings: ExtendedKeySettings,
): string[] =>
  i18n.t('INSTRUCTION_PAGES', {
    returnObjects: true,
    TAP_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.leftIndex
        : keySettings.rightIndex,
    ),
    TAP_FINGER:
      keySettings.preferredHand === 'left' ? LEFT_INDEX() : RIGHT_INDEX(),
    HOLD_FINGER:
      keySettings.preferredHand === 'left' ? RIGHT_INDEX() : LEFT_INDEX(),
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
  });

export const PRACTICE_TRIAL_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('PRACTICE_TRIAL_MESSAGE', {
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
    TAPPING_TASK_INSTRUCTIONS: TAPPING_TASK_INSTRUCTIONS(keySettings),
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
    HOLD_FINGER:
      keySettings.preferredHand === 'left' ? RIGHT_INDEX() : LEFT_INDEX(),
  });

export const PRACTICE_COUNTDOWN_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('PRACTICE_COUNTDOWN_MESSAGE', {
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
  });

export const SUCCESSFUL_HOLD_KEY_MESSAGE = (keyToHold: string): string =>
  i18n.t('SUCCESSFUL_HOLD_KEY_MESSAGE', { HOLD_KEY: toName(keyToHold) });

export const START_FIRST_TAP_INSTRUCTION = (keyToTap: string): string =>
  i18n.t('START_FIRST_TAP_INSTRUCTION', { TAP_KEY: toName(keyToTap) });

export const SUCCESSFUL_FIRST_TAP_MESSAGE = (keyToTap: string): string =>
  i18n.t('SUCCESSFUL_FIRST_TAP_MESSAGE', { TAP_KEY: toName(keyToTap) });

export const SUCCESSFUL_FIRST_TRIAL_MESSAGE = (): string =>
  i18n.t('SUCCESSFUL_FIRST_TRIAL_MESSAGE');

export const PRACTICE_ENDING_TITLE = (): string =>
  i18n.t('PRACTICE_ENDING_TITLE');

export const PRACTICE_ENDING_MESSAGE_RETRY = (): string =>
  i18n.t('PRACTICE_ENDING_MESSAGE_RETRY');

export const PRACTICE_ENDING_MESSAGE_NO_RETRY = (): string =>
  i18n.t('PRACTICE_ENDING_MESSAGE_NO_RETRY');

export const REPEAT_PRACTICE_BUTTON = (): string =>
  i18n.t('REPEAT_PRACTICE_BUTTON');

// --------------------------------
// Helper functions for calibration part
// --------------------------------
export const CALIBRATION_HEADER = (): string => i18n.t('CALIBRATION_HEADER');
export const CALIBRATION_PART = (): string => i18n.t('CALIBRATION_PART');
export const VALIDATION_PRACTICE_HEADER = (): string =>
  i18n.t('VALIDATION_PRACTICE_HEADER');

export const CALIBRATION_INTRODUCTION_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('CALIBRATION_INTRODUCTION_MESSAGE', {
    TAP_KEY: toName(
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
    ),
  });

export const CALIBRATION_PART_1_DIRECTIONS = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('CALIBRATION_PART_1_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
  });

export const CALIBRATION_PART_1_ENDING_MESSAGE = (): string =>
  i18n.t('CALIBRATION_PART_1_ENDING_MESSAGE');

export const CALIBRATION_PART_2_DIRECTIONS = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('CALIBRATION_PART_2_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
    HOLD_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.rightIndex)
        : toName(keySettings.leftIndex),
  });

export const WRAP_UP_HEADER = (): string => i18n.t('WRAP_UP_HEADER');

export const FINAL_CALIBRATION_PART_1_DIRECTIONS = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('FINAL_CALIBRATION_PART_1_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
  });

export const FINAL_CALIBRATION_PART_2_DIRECTIONS = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('FINAL_CALIBRATION_PART_2_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
  });

export const CALIBRATION_PART_2_ENDING_MESSAGE = (): string =>
  i18n.t('CALIBRATION_PART_2_ENDING_MESSAGE');
export const CALIBRATION_FINISHED_DIRECTIONS = (): string =>
  i18n.t('CALIBRATION_FINISHED_DIRECTIONS');

export const FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_1 = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_1', {
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_2 = (): string =>
  i18n.t('FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_2');

// --------------------------------
// Agency Tapping Task Part
// --------------------------------
export const AGENCY_TAPPING_HEADER = (): string =>
  i18n.t('AGENCY_TAPPING_HEADER');

export const AGENCY_TAPPING_INSTRUCTIONS_PAGES = (
  keySettings: ExtendedKeySettings,
): string[] =>
  i18n.t('AGENCY_TAPPING_INSTRUCTION_PAGES', {
    returnObjects: true,
    YES_KEY: 'Y',
    NO_KEY: 'N',
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const BAR_MESSAGE = (): string => i18n.t('BAR_MESSAGE');
export const TARGET_AREA_MESSAGE = (): string => i18n.t('TARGET_AREA_MESSAGE');

export const START_FIRST_AGENCY_TAP_INSTRUCTIONS = (keyToTap: string): string =>
  i18n.t('START_FIRST_AGENCY_TAP_INSTRUCTIONS', { TAP_KEY: keyToTap });

export const KEEP_IN_TARGET_AGENCY_FREEZE_FRAME_INSTRUCTIONS = (): string =>
  i18n.t('KEEP_IN_TARGET_AGENCY_FREEZE_FRAME_INSTRUCTIONS');

export const GET_BACK_IN_TARGET_MESSAGE = (): string =>
  i18n.t('GET_BACK_IN_TARGET_MESSAGE');

export const STAY_IN_TARGET_MESSAGE = (): string =>
  i18n.t('STAY_IN_TARGET_MESSAGE');

export const AGENCY_TASK_CONTROL_QUESTION = (): string =>
  i18n.t('AGENCY_TASK_CONTROL_QUESTION');

export const ANSWER_OPTIONS_INSTRUCTION = (): string =>
  i18n.t('ANSWER_OPTIONS_INSTRUCTION');

export const AGENCY_TAPPING_CORE_BLOCK_INSTRUCTIONS_MESSAGE = (
  breakFrequency: number,
): string =>
  i18n.t('AGENCY_TAPPING_CORE_BLOCK_INSTRUCTIONS_MESSAGE', {
    BREAK_FREQUENCY: breakFrequency,
  });

export const BREAK_TIME = (): string => i18n.t('BREAK_TIME');

export const BREAK_MESSAGE = (breakDuration: string): string =>
  i18n.t('BREAK_MESSAGE', { BREAK_DURATION: breakDuration });

export const SKIP_MESSAGE = (): string => i18n.t('SKIP_MESSAGE');

export const SKIP_BUTTON = (): string => i18n.t('SKIP_BUTTON');

export const AGENCY_TASK_COMPLETION_TITLE = (): string =>
  i18n.t('AGENCY_TASK_COMPLETION_TITLE');

export const AGENCY_TASK_COMPLETION_MESSAGE = (): string =>
  i18n.t('AGENCY_TASK_COMPLETION_MESSAGE');

export const TASK_COMPLETION_BREAK_MESSAGE = (breakDuration: string): string =>
  i18n.t('TASK_COMPLETION_BREAK_MESSAGE', { BREAK_DURATION: breakDuration });

// --------------------------------
// Helper functions for validation part
// --------------------------------
export const PASSED_VALIDATION_MESSAGE = (): string =>
  i18n.t('PASSED_VALIDATION_MESSAGE');

export const FAILED_VALIDATION_MESSAGE = (): string =>
  i18n.t('FAILED_VALIDATION_MESSAGE');

export const ADDITIONAL_CALIBRATION_PART_1_DIRECTIONS = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('ADDITIONAL_CALIBRATION_PART_1_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
  });

export const TRIAL_NOT_SUCCESSFUL_MESSAGE = (): string =>
  i18n.t('TRIAL_NOT_SUCCESSFUL_MESSAGE');

// --------------------------------
// Helper function for countdown and tapping trial
// --------------------------------
export const KEY_TAPPED_EARLY_FIRST_ERROR_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('KEY_TAPPED_EARLY_FIRST_ERROR_MESSAGE', {
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
  });

export const KEY_RELEASED_EARLY_FIRST_ERROR_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('KEY_RELEASED_EARLY_FIRST_ERROR_MESSAGE', {
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
  });

export const NOT_ENOUGH_TAPS_FIRST_ERROR_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('NOT_ENOUGH_TAPS_FIRST_ERROR_MESSAGE', {
    TAP_KEY:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
  });

export const HOLD_KEYS_MESSAGE = (keySettings: ExtendedKeySettings): string =>
  i18n.t('HOLD_KEYS_MESSAGE', {
    HOLD_KEYS_REPLACE:
      keySettings.preferredHand === 'left'
        ? `<b>${toName(keySettings.rightIndex)}</b>`
        : `<b>${toName(keySettings.leftIndex)}</b>`,
  });

// --------------------------------
// Helper function for core experiment
// --------------------------------
export const CORE_TAPPING_HEADER = (): string => i18n.t('CORE_TAPPING_HEADER');
export const INSTRUCTIONS_SUB_HEADER = (): string =>
  i18n.t('INSTRUCTIONS_SUB_HEADER');

export const CORE_TAPPING_INSTRUCTIONS_PAGES = (
  state: ExperimentState,
): string[] => {
  const keySettings = state.getKeySettings();
  return i18n.t('CORE_TAPPING_INSTRUCTIONS_PAGES', {
    returnObjects: true,
    NUMBER_OF_BLOCKS:
      state.getTaskSettings().taskBlockRepetitions *
      state.getTaskSettings().taskBlocksIncluded.length,
    NUMBER_OF_DEMO_TRIALS,
    POINT_VALUE,
    CURRENCY,
    ACCEPT_OFFER_BUTTON,
    DECLINE_OFFER_BUTTON,
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
    TAP_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.leftIndex
        : keySettings.rightIndex,
    ),
    HOLD_FINGER:
      keySettings.preferredHand === 'left' ? RIGHT_INDEX() : LEFT_INDEX(),
    TAP_FINGER:
      keySettings.preferredHand === 'left' ? LEFT_INDEX() : RIGHT_INDEX(),
  });
};

export const REMEMBER_PAGE_TITLE = (): string => i18n.t('REMEMBER_PAGE_TITLE');

export const REMEMBER_PAGE_DIRECTIONS = (state: ExperimentState): string => {
  const keySettings = state.getKeySettings();
  return i18n.t('REMEMBER_PAGE_DIRECTIONS', {
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
    TAP_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.leftIndex
        : keySettings.rightIndex,
    ),
  });
};

export const CONTINUE_MESSAGE_DIRECTION = (): string =>
  i18n.t('CONTINUE_MESSAGE_DIRECTION');

export const VALIDATION_DIRECTIONS = (): string =>
  i18n.t('VALIDATION_DIRECTIONS');
export const PREMATURE_KEY_RELEASE_ERROR_MESSAGE = (): string =>
  i18n.t('PREMATURE_KEY_RELEASE_ERROR_MESSAGE');

export const FAILED_MINIMUM_DEMO_TAPS_MESSAGE = (): string =>
  i18n.t('FAILED_MINIMUM_DEMO_TAPS_MESSAGE');

export const TRIAL_FAILED = (): string => i18n.t('TRIAL_FAILED');
export const TRIAL_SUCCEEDED = (): string => i18n.t('TRIAL_SUCCEEDED');
export const FREE_TRIAL = (): string => i18n.t('FREE_TRIAL');
export const GO_MESSAGE = (): string => i18n.t('GO_MESSAGE');
export const LOADING_BAR_MESSAGE = (): string => i18n.t('LOADING_BAR_MESSAGE');

export const COUNTDOWN_TIMER_MESSAGE = (): string =>
  i18n.t('COUNTDOWN_TIMER_MESSAGE');

export const KEY_TAPPED_EARLY_MESSAGE = (): string =>
  i18n.t('KEY_TAPPED_EARLY_MESSAGE');

export const PRACTICE_MESSAGE = (
  keyToTap: string,
  keysToHold: string[],
): string =>
  i18n.t('PRACTICE_MESSAGE', {
    TAP_KEY: toName(keyToTap),
    HOLD_KEY: keysToHold.map((key) => toName(key)).join(' and '),
  });

export const RELEASE_KEYS_MESSAGE = (): string =>
  i18n.t('RELEASE_KEYS_MESSAGE');

export const REWARD_TOTAL_MESSAGE = (
  totalSuccessfulReward: string,
  monetaryEquivalent: string,
  currency: string,
): string =>
  i18n.t('REWARD_TOTAL_MESSAGE', {
    totalSuccessfulReward,
    monetaryEquivalent,
    currency,
  });

export const EXPERIMENT_BEGIN_MESSAGE = (): string =>
  i18n.t('EXPERIMENT_BEGIN_MESSAGE');

export const VALIDATION_VIDEO_TUTORIAL_MESSAGE = (
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('VALIDATION_VIDEO_TUTORIAL_MESSAGE', {
    HOLD_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.rightIndex
        : keySettings.leftIndex,
    ),
    TAP_KEY: toName(
      keySettings.preferredHand === 'left'
        ? keySettings.leftIndex
        : keySettings.rightIndex,
    ),
  });

export const DEMO_TRIAL_MESSAGE = (
  numDemo: number,
  numTrials: number,
  keySettings: ExtendedKeySettings,
): string =>
  i18n.t('DEMO_TRIAL_MESSAGE', {
    NUM_DEMO_TRIALS: numDemo,
    NUM_TRIALS: numTrials,
    KEY_TO_PRESS:
      keySettings.preferredHand === 'left'
        ? toName(keySettings.leftIndex)
        : toName(keySettings.rightIndex),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const REWARD_TRIAL_MESSAGE = (): string =>
  i18n.t('REWARD_TRIAL_MESSAGE');

export const ACCEPTANCE_TRIAL_MESSAGE = (): string =>
  i18n.t('ACCEPTANCE_TRIAL_MESSAGE');

// --------------------------------
// Helper functions for likert surveys
// --------------------------------
export const LIKERT_PREAMBLE_BLOCK = (): string =>
  i18n.t('LIKERT_PREAMBLE_BLOCK');
export const LIKERT_PREAMBLE_DEMO = (): string =>
  i18n.t('LIKERT_PREAMBLE_DEMO');
export const LIKERT_PREAMBLE_FINAL_QUESTIONS = (): string =>
  i18n.t('LIKERT_PREAMBLE_FINAL_QUESTIONS');
export const LIKERT_INTRO = (): string => i18n.t('LIKERT_INTRO');
export const LIKERT_INTRO_DEMO = (): string => i18n.t('LIKERT_INTRO_DEMO');

export const LIKERT_RESPONSES = (): Record<string, string> => ({
  STRONGLY_DISAGREE: i18n.t('LIKERT_RESPONSES.STRONGLY_DISAGREE'),
  SOMEWHAT_DISAGREE: i18n.t('LIKERT_RESPONSES.SOMEWHAT_DISAGREE'),
  DISAGREE: i18n.t('LIKERT_RESPONSES.DISAGREE'),
  NEUTRAL: i18n.t('LIKERT_RESPONSES.NEUTRAL'),
  AGREE: i18n.t('LIKERT_RESPONSES.AGREE'),
  SOMEWHAT_AGREE: i18n.t('LIKERT_RESPONSES.SOMEWHAT_AGREE'),
  STRONGLY_AGREE: i18n.t('LIKERT_RESPONSES.STRONGLY_AGREE'),
});

export const LIKERT_RESPONSES_ATTENTION = (): Record<string, string> => ({
  LOW: i18n.t('LIKERT_RESPONSES.LOW_ATTENTION'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_ATTENTION'),
});

export const LIKERT_RESPONSES_MOTIVATION = (): Record<string, string> => ({
  LOW: i18n.t('LIKERT_RESPONSES.LOW_MOTIVATION'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_MOTIVATION'),
});

export const LIKERT_RESPONSES_FATIGUE = (): Record<string, string> => ({
  LOW: i18n.t('LIKERT_RESPONSES.LOW_FATIGUE'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_FATIGUE'),
});

export const LIKERT_RESPONSES_TIREDNESS = (): Record<string, string> => ({
  LOW: i18n.t('LIKERT_RESPONSES.LOW_TIREDNESS'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_TIREDNESS'),
});

export const LIKERT_SURVEY_1_QUESTIONS = (): Record<string, string> => ({
  QUESTION_1: i18n.t('LIKERT_SURVEY_1_QUESTIONS.QUESTION_1'),
  QUESTION_2: i18n.t('LIKERT_SURVEY_1_QUESTIONS.QUESTION_2'),
});

export const LIKERT_SURVEY_2_QUESTIONS = (): Record<string, string> => ({
  QUESTION_1: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_1'),
  QUESTION_2: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_2'),
  QUESTION_3: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_3'),
  QUESTION_4: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_4'),
  QUESTION_5: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_5'),
  QUESTION_6: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_6'),
});

export const LIKERT_SURVEY_3_QUESTIONS = (): Record<string, string> => ({
  QUESTION_1: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_1'),
  QUESTION_2: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_2'),
  QUESTION_3: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_3'),
  QUESTION_4: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_4'),
});

// --------------------------------
// Helper functions for progress bar
// --------------------------------
export const PROGRESS_BAR = (): Record<string, string> => ({
  PROGRESS_BAR_INTRODUCTION: i18n.t('PROGRESS_BAR.PROGRESS_BAR_INTRODUCTION'),
  PROGRESS_BAR_PRACTICE: i18n.t('PROGRESS_BAR.PROGRESS_BAR_PRACTICE'),
  PROGRESS_BAR_CALIBRATION: i18n.t('PROGRESS_BAR.PROGRESS_BAR_CALIBRATION'),
  PROGRESS_BAR_VALIDATION: i18n.t('PROGRESS_BAR.PROGRESS_BAR_VALIDATION'),
  PROGRESS_BAR_TRIAL_BLOCKS: i18n.t('PROGRESS_BAR.PROGRESS_BAR_TRIAL_BLOCKS'),
  PROGRESS_BAR_AGENCY_BLOCKS: i18n.t('PROGRESS_BAR.PROGRESS_BAR_AGENCY_BLOCKS'),
  PROGRESS_BAR_FINAL_CALIBRATION: i18n.t(
    'PROGRESS_BAR.PROGRESS_BAR_FINAL_CALIBRATION',
  ),
});

export const imagePathInstructions = (
  index: number,
  state: ExperimentState,
): string => {
  const basePath = '/assets/images/';
  switch (index) {
    case 0:
      return state.getKeySettings().preferredHand === 'left'
        ? `${basePath}hand-l-3.png`
        : `${basePath}hand-r-3.png`;
    case 1:
      return `${basePath}two-offer-view.png`;
    case 2:
      return `${basePath}accept-refuse.png`;
    default:
      return '';
  }
};

// --------------------------------
// Helper functions for ending part
// --------------------------------
export const EXPERIMENT_HAS_ENDED_MESSAGE = (): string =>
  i18n.t('EXPERIMENT_HAS_ENDED_MESSAGE');

export const END_EXPERIMENT_MESSAGE = (): string =>
  i18n.t('END_EXPERIMENT_MESSAGE');

// --------------------------------
// Helper functions for instruction pages
// --------------------------------
export const INSTRUCTION_LABEL = {
  [InstructionIDs.Tapping]: i18n.t('INSTRUCTION_LABEL_TAPPING'),
  [InstructionIDs.EBDM]: i18n.t('INSTRUCTION_LABEL_EBDM'),
  [InstructionIDs.Agency]: i18n.t('INSTRUCTION_LABEL_AGENCY'),
};

export const SELECT_INSTRUCTION_TOPIC = (): string =>
  i18n.t('SELECT_INSTRUCTION_TOPIC');
