// eslint-disable-next-line import/no-cycle
import { type KeySettings } from '@/modules/context/SettingsContext';

import i18n from '../jspsych/i18n';
import { BoundsType, DelayType, RewardType } from './types';

export const LOADING_BAR_SPEED_NO = 50;
export const LOADING_BAR_SPEED_YES = 5;

export const AUTO_DECREASE_AMOUNT = 2;
export const AUTO_DECREASE_RATE = 100;
export const AUTO_INCREASE_AMOUNT = 10;
export const MAXIMUM_THERMOMETER_HEIGHT = 100;
export const EXPECTED_MAXIMUM_PERCENTAGE = 100;
export const NUM_TAPS_WITHOUT_DELAY = 5;

export const DELAY_DEFINITIONS: { [key in DelayType]: [number, number] } = {
  [DelayType.Sync]: [0, 0],
  [DelayType.NarrowAsync]: [400, 600],
  [DelayType.WideAsync]: [0, 1000],
};

export const BOUNDS_DEFINITIONS: { [key in BoundsType]: [number, number] } = {
  [BoundsType.Easy]: [5, 23],
  [BoundsType.EasyMedium]: [23, 41],
  [BoundsType.Medium]: [41, 59],
  [BoundsType.MediumHard]: [59, 77],
  [BoundsType.Hard]: [77, 95],
};

export const REWARD_DEFINITIONS: {
  [key in RewardType]: number;
} = {
  [RewardType.Low]: 1,
  [RewardType.LowMiddle]: 5,
  [RewardType.Middle]: 10,
  [RewardType.MiddleHigh]: 20,
  [RewardType.High]: 40,
};

export const DEFAULT_REWARD_YITTER = 0.5;
export const DEFAULT_BOUNDS_VARIATION = 3;
export const TOTAL_REWARD_MONEY = 6;
export const CURRENCY = 'EUR';

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
export const SUCCESS_SCREEN_DURATION = 500;
export const COUNTDOWN_TIME = 2;
export const PREMATURE_KEY_RELEASE_ERROR_TIME = 1000;
export const KEY_TAPPED_EARLY_ERROR_TIME = 3000;
export const KEYBOARD_LAYOUT = '';

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

// Messages
export const customKeyOrder = [
  'leftPink',
  'leftRing',
  'leftMiddle',
  'leftThumb',
  'rightIndex',
];

export const PASSED_VALIDATION_MESSAGE = i18n.t('PASSED_VALIDATION_MESSAGE');
export const FAILED_VALIDATION_MESSAGE = i18n.t('FAILED_VALIDATION_MESSAGE');
export const KEY_INSTRUCTIONS = (keySettings: KeySettings): string[] =>
  Object.entries(keySettings)
    .filter(([key]) => key !== 'leftIndex')
    .sort(
      ([keyA], [keyB]) =>
        customKeyOrder.indexOf(keyA) - customKeyOrder.indexOf(keyB),
    )
    .map(([index, key]) => {
      if (key) {
        switch (index) {
          case 'leftIndex':
            return i18n.t('LEFT_INDEX_INSTRUCTION', {
              KEY_REPLACE: toName(key),
            });
          case 'leftPink':
            return i18n.t('LEFT_PINK_INSTRUCTION', {
              KEY_REPLACE: toName(key),
            });
          case 'leftRing':
            return i18n.t('LEFT_RING_INSTRUCTION', {
              KEY_REPLACE: toName(key),
            });
          case 'leftMiddle':
            return i18n.t('LEFT_MIDDLE_INSTRUCTION', {
              KEY_REPLACE: toName(key),
            });
          case 'leftThumb':
            return i18n.t('LEFT_THUMB_INSTRUCTION', {
              KEY_REPLACE: toName(key),
            });
          case 'rightIndex':
            return i18n.t('RIGHT_INDEX_INSTRUCTION', {
              KEY_REPLACE: toName(key),
            });
          default:
            return '';
        }
      } else {
        return '';
      }
    });

export const WARNING_MESSAGES_INSTRUCTION = (
  keySettings: KeySettings,
): string => {
  const holdKeysReplace = Object.entries(keySettings)
    .sort(
      ([keyA], [keyB]) =>
        customKeyOrder.indexOf(keyA) - customKeyOrder.indexOf(keyB),
    )
    .map(([index, key], indexNr) => {
      if (!key || index === 'leftIndex') {
        return '';
      }
      if (indexNr === Object.entries(keySettings).length - 1) {
        return `<b>${toName(key)}</b>`;
      }
      if (indexNr === Object.entries(keySettings).length - 2) {
        return `<b>${toName(key)}</b> and `;
      }
      return `<b>${toName(key)}</b>, `;
    })
    .join('');
  return i18n.t('WARNING_MESSAGES_INSTRUCTION', {
    TAP_KEY_REPLACE: keySettings.leftIndex.toUpperCase(),
    HOLD_KEYS_REPLACE: holdKeysReplace,
  });
};

export const TAP_ON_GO_INSTRUCTION = (keySettings: KeySettings): string =>
  i18n.t('TAP_ON_GO_INSTRUCTION', {
    KEY_TO_PRESS: keySettings.leftIndex.toUpperCase(),
  });

export const KEY_INSTRUCTIONS_LIST = (keySettings: KeySettings): string =>
  `<ul>${Object.values(KEY_INSTRUCTIONS(keySettings))
    .map((instruction) => `<li>${instruction}</li>`)
    .join('')}</ul>`;
export const TUTORIAL_INTRODUCTION_MESSAGE = i18n.t(
  'TUTORIAL_INTRODUCTION_MESSAGE',
);
export const CALIBRATION_SECTION_MESSAGE = i18n.t(
  'CALIBRATION_SECTION_MESSAGE',
);
export const VALIDATION_WARNING_MESSAGE = i18n.t('VALIDATION_WARNING_MESSAGE');
export const EXTRA_VALIDATION_WARNING_MESSAGE = i18n.t(
  'EXTRA_VALIDATION_WARNING_MESSAGE',
);

export const CALIBRATION_PART_1_DIRECTIONS = (
  keySettings: KeySettings,
): string =>
  i18n.t('CALIBRATION_PART_1_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    TAP_ON_GO_INSTRUCTION: `<p>${TAP_ON_GO_INSTRUCTION(keySettings)}</p>`,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });
export const ADDITIONAL_CALIBRATION_PART_1_DIRECTIONS = (
  keySettings: KeySettings,
): string =>
  i18n.t('ADDITIONAL_CALIBRATION_PART_1_DIRECTIONS', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    TAP_ON_GO_INSTRUCTION: `<p>${TAP_ON_GO_INSTRUCTION(keySettings)}</p>`,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });
export const CALIBRATION_PART_1_ENDING_MESSAGE = i18n.t(
  'CALIBRATION_PART_1_ENDING_MESSAGE',
);
export const CALIBRATION_PART_2_DIRECTIONS = i18n.t(
  'CALIBRATION_PART_2_DIRECTIONS',
);
export const CONTINUE_MESSAGE_DIRECTION = i18n.t('CONTINUE_MESSAGE_DIRECTION');
export const TRIAL_BLOCKS_DIRECTIONS = i18n.t('TRIAL_BLOCKS_DIRECTIONS');
export const REWARD_PAGE_DIRECTIONS = i18n.t('REWARD_PAGE_DIRECTIONS');
export const REMEMBER_PAGE_DIRECTIONS = i18n.t('REMEMBER_PAGE_DIRECTIONS');
export const CALIBRATION_PART_2_ENDING_MESSAGE = i18n.t(
  'CALIBRATION_PART_2_ENDING_MESSAGE',
);
export const CALIBRATION_FINISHED_DIRECTIONS = i18n.t(
  'CALIBRATION_FINISHED_DIRECTIONS',
);

export const FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_1 = (
  keySettings: KeySettings,
): string =>
  i18n.t('FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_1', {
    TAP_ON_GO_INSTRUCTION: `<p>${TAP_ON_GO_INSTRUCTION(keySettings)}</p>`,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_2 = (
  keySettings: KeySettings,
): string =>
  i18n.t('FINAL_CALIBRATION_SECTION_DIRECTIONS_PART_2', {
    TAP_ON_GO_INSTRUCTION: `<p>${TAP_ON_GO_INSTRUCTION(keySettings)}</p>`,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const VALIDATION_DIRECTIONS = i18n.t('VALIDATION_DIRECTIONS');
export const PREMATURE_KEY_RELEASE_ERROR_MESSAGE = i18n.t(
  'PREMATURE_KEY_RELEASE_ERROR_MESSAGE',
);
export const LIKERT_PREAMBLE_BLOCK = i18n.t('LIKERT_PREAMBLE_BLOCK');
export const LIKERT_PREAMBLE_DEMO = i18n.t('LIKERT_PREAMBLE_DEMO');
export const LIKERT_PREAMBLE_FINAL_QUESTIONS = i18n.t(
  'LIKERT_PREAMBLE_FINAL_QUESTIONS',
);
export const LIKERT_INTRO = i18n.t('LIKERT_INTRO');
export const LIKERT_INTRO_DEMO = i18n.t('LIKERT_INTRO_DEMO');

export const FAILED_MINIMUM_DEMO_TAPS_MESSAGE = i18n.t(
  'FAILED_MINIMUM_DEMO_TAPS_MESSAGE',
);
export const HOLD_KEYS_MESSAGE = (keySettings: KeySettings): string => {
  const holdKeysMessage = Object.entries(keySettings)
    .sort(
      ([keyA], [keyB]) =>
        customKeyOrder.indexOf(keyA) - customKeyOrder.indexOf(keyB),
    )
    .map(([index, key], indexNr) => {
      if (!key || index === 'leftIndex') {
        return '';
      }
      if (indexNr === Object.entries(keySettings).length - 1) {
        return `<b id="button_${key.toLowerCase()}">${toName(key)}</b>`;
      }
      if (indexNr === Object.entries(keySettings).length - 2) {
        return `<b id="button_${key.toLowerCase()}">${toName(key)}</b> and `;
      }
      return `<b id="button_${key.toLowerCase()}">${toName(key)}</b>, `;
    })
    .join('');
  return i18n.t('HOLD_KEYS_MESSAGE', {
    HOLD_KEYS_REPLACE: holdKeysMessage,
  });
};
export const KEY_TAPPED_EARLY_MESSAGE = i18n.t('KEY_TAPPED_EARLY_MESSAGE');
export const PRACTICE_MESSAGE = (keyToTap: string): string =>
  i18n.t('PRACTICE_MESSAGE', { KEY_REPLACE: toName(keyToTap) });
export const CALIBRATION_MESSAGE = (keyToTap: string): string =>
  i18n.t('CALIBRATION_MESSAGE', { KEY_REPLACE: toName(keyToTap) });
export const RELEASE_KEYS_MESSAGE = i18n.t('RELEASE_KEYS_MESSAGE');
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

export const EXPERIMENT_BEGIN_MESSAGE = i18n.t('EXPERIMENT_BEGIN_MESSAGE');
export const NO_STIMULI_VIDEO_TUTORIAL_MESSAGE = (
  keySettings: KeySettings,
): string => {
  const keyInstructionsText = `<ul>${Object.values(
    KEY_INSTRUCTIONS(keySettings),
  )
    .map((instruction) => `<li>${instruction}</li>`)
    .join('')}</ul>`;
  return i18n.t('NO_STIMULI_VIDEO_TUTORIAL_MESSAGE', {
    KEY_INSTRUCTIONS_TEXT: keyInstructionsText,
    TAP_ON_GO_INSTRUCTION: `<p>${TAP_ON_GO_INSTRUCTION(keySettings)}</p>`,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });
};
export const STIMULI_VIDEO_TUTORIAL_MESSAGE = (
  keySettings: KeySettings,
): string => {
  const keyInstructionsText = `<ul>${Object.entries(
    KEY_INSTRUCTIONS(keySettings),
  ).map((instruction) => `<li>${instruction}</li>`)}</ul>`;
  return i18n.t('STIMULI_VIDEO_TUTORIAL_MESSAGE', {
    KEY_INSTRUCTIONS_TEXT: keyInstructionsText,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });
};

export const VALIDATION_VIDEO_TUTORIAL_MESSAGE = (
  keySettings: KeySettings,
): string =>
  i18n.t('VALIDATION_VIDEO_TUTORIAL_MESSAGE', {
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const INTERACTIVE_KEYBOARD_TUTORIAL_MESSAGE = (
  keySettings: KeySettings,
): string =>
  i18n.t('INTERACTIVE_KEYBOARD_TUTORIAL_MESSAGE', {
    KEY_INSTRUCTIONS_TEXT: KEY_INSTRUCTIONS_LIST(keySettings),
    TAP_ON_GO_INSTRUCTION: `<p>${TAP_ON_GO_INSTRUCTION(keySettings)}</p>`,
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const DEMO_TRIAL_MESSAGE = (
  numDemo: number,
  numTrials: number,
  keySettings: KeySettings,
): string =>
  i18n.t('DEMO_TRIAL_MESSAGE', {
    NUM_DEMO_TRIALS: numDemo,
    NUM_TRIALS: numTrials,
    KEY_TO_PRESS: keySettings.leftIndex.toUpperCase(),
    WARNING_MESSAGES_INSTRUCTION: WARNING_MESSAGES_INSTRUCTION(keySettings),
  });

export const ACCEPTANCE_TRIAL_MESSAGE = i18n.t('ACCEPTANCE_TRIAL_MESSAGE');
export const DOMINANT_HAND_MESSAGE = i18n.t('DOMINANT_HAND_MESSAGE');
export const TRIAL_FAILED = i18n.t('TRIAL_FAILED');
export const TRIAL_SUCCEEDED = i18n.t('TRIAL_SUCCEEDED');
export const GO_MESSAGE = i18n.t('GO_MESSAGE');
export const LOADING_BAR_MESSAGE = i18n.t('LOADING_BAR_MESSAGE');
export const CONTINUE_BUTTON_MESSAGE = i18n.t('CONTINUE_BUTTON_MESSAGE');
export const START_BUTTON_MESSAGE = i18n.t('START_BUTTON_MESSAGE');
export const FINISH_BUTTON_MESSAGE = i18n.t('FINISH_BUTTON_MESSAGE');
export const COUNTDOWN_TIMER_MESSAGE = i18n.t('COUNTDOWN_TIMER_MESSAGE');
export const REWARD_TRIAL_MESSAGE = i18n.t('REWARD_TRIAL_MESSAGE');

export const LIKERT_RESPONSES = {
  STRONGLY_DISAGREE: i18n.t('LIKERT_RESPONSES.STRONGLY_DISAGREE'),
  SOMEWHAT_DISAGREE: i18n.t('LIKERT_RESPONSES.SOMEWHAT_DISAGREE'),
  DISAGREE: i18n.t('LIKERT_RESPONSES.DISAGREE'),
  NEUTRAL: i18n.t('LIKERT_RESPONSES.NEUTRAL'),
  AGREE: i18n.t('LIKERT_RESPONSES.AGREE'),
  SOMEWHAT_AGREE: i18n.t('LIKERT_RESPONSES.SOMEWHAT_AGREE'),
  STRONGLY_AGREE: i18n.t('LIKERT_RESPONSES.STRONGLY_AGREE'),
};
export const LIKERT_RESPONSES_ATTENTION = {
  LOW: i18n.t('LIKERT_RESPONSES.LOW_ATTENTION'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_ATTENTION'),
};
export const LIKERT_RESPONSES_MOTIVATION = {
  LOW: i18n.t('LIKERT_RESPONSES.LOW_MOTIVATION'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_MOTIVATION'),
};
export const LIKERT_RESPONSES_FATIGUE = {
  LOW: i18n.t('LIKERT_RESPONSES.LOW_FATIGUE'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_FATIGUE'),
};
export const LIKERT_RESPONSES_TIREDNESS = {
  LOW: i18n.t('LIKERT_RESPONSES.LOW_TIREDNESS'),
  HIGH: i18n.t('LIKERT_RESPONSES.HIGH_TIREDNESS'),
};
export const LIKERT_SURVEY_1_QUESTIONS = {
  QUESTION_1: i18n.t('LIKERT_SURVEY_1_QUESTIONS.QUESTION_1'),
  QUESTION_2: i18n.t('LIKERT_SURVEY_1_QUESTIONS.QUESTION_2'),
};
export const LIKERT_SURVEY_2_QUESTIONS = {
  QUESTION_1: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_1'),
  QUESTION_2: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_2'),
  QUESTION_3: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_3'),
  QUESTION_4: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_4'),
  QUESTION_5: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_5'),
  QUESTION_6: i18n.t('LIKERT_SURVEY_2_QUESTIONS.QUESTION_6'),
};
export const LIKERT_SURVEY_3_QUESTIONS = {
  QUESTION_1: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_1'),
  QUESTION_2: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_2'),
  QUESTION_3: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_3'),
  QUESTION_4: i18n.t('LIKERT_SURVEY_3_QUESTIONS.QUESTION_4'),
};
export const END_EXPERIMENT_MESSAGE = i18n.t('END_EXPERIMENT_MESSAGE');

export const PROGRESS_BAR = {
  PROGRESS_BAR_INTRODUCTION: i18n.t('PROGRESS_BAR.PROGRESS_BAR_INTRODUCTION'),
  PROGRESS_BAR_PRACTICE: i18n.t('PROGRESS_BAR.PROGRESS_BAR_PRACTICE'),
  PROGRESS_BAR_CALIBRATION: i18n.t('PROGRESS_BAR.PROGRESS_BAR_CALIBRATION'),
  PROGRESS_BAR_VALIDATION: i18n.t('PROGRESS_BAR.PROGRESS_BAR_VALIDATION'),
  PROGRESS_BAR_TRIAL_BLOCKS: i18n.t('PROGRESS_BAR.PROGRESS_BAR_TRIAL_BLOCKS'),
  PROGRESS_BAR_FINAL_CALIBRATION: i18n.t(
    'PROGRESS_BAR.PROGRESS_BAR_FINAL_CALIBRATION',
  ),
};

export const SIT_COMFORTABLY_MESSAGE = i18n.t('SIT_COMFORTABLY_MESSAGE');
export const INTRODUCTION_HEADER = i18n.t('INTRODUCTION_HEADER');

export const EXPERIMENT_HAS_ENDED_MESSAGE = i18n.t(
  'EXPERIMENT_HAS_ENDED_MESSAGE',
);
export const CLICK_BUTTON_TO_PROCEED_MESSAGE = i18n.t(
  'CLICK_BUTTON_TO_PROCEED_MESSAGE',
);
export const ENABLE_BUTTON_AFTER_TIME = 15000; // default is 15000 ms
export const HAND_TUTORIAL_MESSAGE = i18n.t('HAND_TUTORIAL_MESSAGE');
export const TUTORIAL_HEADER = i18n.t('TUTORIAL_HEADER');
export const CONTINUE_MESSAGE_TITLE = i18n.t('CONTINUE_MESSAGE_TITLE');
export const TRIAL_BLOCKS_TITLE = i18n.t('TRIAL_BLOCKS_TITLE');
export const REWARD_PAGE_TITLE = i18n.t('REWARD_PAGE_TITLE');
export const REMEMBER_PAGE_TITLE = i18n.t('REMEMBER_PAGE_TITLE');
