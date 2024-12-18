import {
  boundsSortOrder,
  delaySortOrder,
  rewardSortOrder,
} from '@/modules/config/appSettings';
import {
  AllSettingsType,
  CalibrationSettingsType,
  GeneralSettingsType,
  PracticeSettingsType,
  TaskSettingsType,
  ValidationSettingsType,
} from '@/modules/context/SettingsContext';

import {
  BoundsType,
  CalibrationPartType,
  DelayType,
  RewardType,
  ValidationPartType,
} from '../utils/types';
import { sortEnumArray } from '../utils/utils';

type CurrentCalibrationStepSuccessesType = {
  [key in CalibrationPartType]: number;
};

export type MedianTapsType = {
  [key in CalibrationPartType]: number;
};

type CalibrationPartsPassedType = {
  [key in CalibrationPartType]: boolean;
};

type ValidationFailuresType = {
  [key in ValidationPartType]: number;
};

type ValidationStateType = {
  failures: ValidationFailuresType;
  validationSuccess: boolean;
  extraValidationRequired: boolean;
};

interface State {
  medianTaps: MedianTapsType;
  currentCalibrationStepSuccesses: CurrentCalibrationStepSuccessesType;
  calibrationPartsPassed: CalibrationPartsPassedType;
  validationState: ValidationStateType;
  failedMinimumDemoTapsTrial: number;
  demoTrialSuccesses: number;
  completedBlockCount: number;
  numberOfPracticeLoopsCompleted: number;
  userID: string;
}

// Create an object that sets the default required trial calibrations to 1
const defaultRequiredTrialsCalibration: {
  [key in CalibrationPartType]: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {} as any;
Object.values(CalibrationPartType).forEach((part) => {
  defaultRequiredTrialsCalibration[part] = 1;
});

// Create an object that sets the default current trial success at 0 for all calibration parts
const defaultCurrentTrialsCalibration: {
  [key in CalibrationPartType]: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {} as any;
Object.values(CalibrationPartType).forEach((part) => {
  defaultCurrentTrialsCalibration[part] = 0;
});

// Create an object that sets the default current median taps at 0 for all callibration parts
export const defaultMedianTaps: {
  [key in CalibrationPartType]: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {} as any;
Object.values(CalibrationPartType).forEach((part) => {
  defaultMedianTaps[part] = 10;
});

// Create an object that sets the default current calibration steps passed (all false by default)
const defaultCalibrationPartsPassed: {
  [key in CalibrationPartType]: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {} as any;
Object.values(CalibrationPartType).forEach((part) => {
  defaultCalibrationPartsPassed[part] = false;
});

// Create an object that sets the default validation failures (0 for each validation step)
const defaultValidationFailures: {
  [key in ValidationPartType]: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} = {} as any;
Object.values(ValidationPartType).forEach((part) => {
  defaultValidationFailures[part] = 0;
});

const defaultValidationState: ValidationStateType = {
  failures: defaultValidationFailures,
  validationSuccess: true,
  extraValidationRequired: false,
};

// Step 2: Create the ExperimentState class
export class ExperimentState {
  // Define a single "variables" object to store the state
  private state: State;

  private settings: AllSettingsType;

  constructor(settingsVariables: AllSettingsType) {
    // Initialize all the state variables in the constructor
    this.state = {
      medianTaps: defaultMedianTaps,
      currentCalibrationStepSuccesses: defaultCurrentTrialsCalibration,
      calibrationPartsPassed: defaultCalibrationPartsPassed,
      validationState: defaultValidationState,
      failedMinimumDemoTapsTrial: 0,
      demoTrialSuccesses: 0,
      completedBlockCount: 1,
      numberOfPracticeLoopsCompleted: 1,
      userID: '',
    };
    this.settings = {
      generalSettings: {
        usePhotoDiode: settingsVariables.generalSettings.usePhotoDiode || 'off',
      },
      practiceSettings: {
        numberOfPracticeLoops:
          settingsVariables.practiceSettings.numberOfPracticeLoops || 1,
      },
      calibrationSettings: {
        requiredTrialsCalibration: {
          ...defaultRequiredTrialsCalibration,
          ...settingsVariables.calibrationSettings.requiredTrialsCalibration,
        },
        minimumCalibrationMedianTaps:
          settingsVariables.calibrationSettings.minimumCalibrationMedianTaps ||
          10,
      },
      validationSettings: {
        numberOfValidationsPerType:
          settingsVariables.validationSettings.numberOfValidationsPerType || 1,
        percentageOfValidationSuccessesRequired:
          settingsVariables.validationSettings
            .percentageOfValidationSuccessesRequired || 75,
        percentageOfExtraValidationSuccessesRequired:
          settingsVariables.validationSettings
            .percentageOfExtraValidationSuccessesRequired || 50,
      },
      taskSettings: settingsVariables.taskSettings || {
        taskBlocksIncluded: [
          DelayType.Sync,
          DelayType.NarrowAsync,
          DelayType.WideAsync,
        ],
        taskRewardsIncluded: [
          RewardType.Low,
          RewardType.Middle,
          RewardType.High,
        ],
        taskBoundsIncluded: [
          BoundsType.Easy,
          BoundsType.Medium,
          BoundsType.Hard,
        ],
        taskBlockRepetitions: 2,
        taskPermutationRepetitions: 1,
        randomSkipChance: 0,
      },
    };
  }

  getState(): State {
    return this.state;
  }

  getSettings(): AllSettingsType {
    return this.settings;
  }

  getGeneralSettings(): GeneralSettingsType {
    return this.settings.generalSettings;
  }

  getPracticeSettings(): PracticeSettingsType {
    return this.settings.practiceSettings;
  }

  getCalibrationSettings(): CalibrationSettingsType {
    return this.settings.calibrationSettings;
  }

  getValidationSettings(): ValidationSettingsType {
    return this.settings.validationSettings;
  }

  getTaskSettings(): TaskSettingsType {
    return {
      ...this.settings.taskSettings,
      taskBoundsIncluded: sortEnumArray<BoundsType>(
        this.settings.taskSettings.taskBoundsIncluded,
        boundsSortOrder,
      ),
      taskRewardsIncluded: sortEnumArray<RewardType>(
        this.settings.taskSettings.taskRewardsIncluded,
        rewardSortOrder,
      ),
      taskBlocksIncluded: sortEnumArray<DelayType>(
        this.settings.taskSettings.taskBlocksIncluded,
        delaySortOrder,
      ),
    };
  }

  getCurrentSuccesses = (calibrationPart: CalibrationPartType): number =>
    this.state.currentCalibrationStepSuccesses[calibrationPart];

  getRequiredSuccesses = (calibrationPart: CalibrationPartType): number =>
    this.settings.calibrationSettings.requiredTrialsCalibration[
      calibrationPart
    ];

  // Update user ID
  setUserID(userID: string): void {
    this.state.userID = userID;
  }

  // Update median taps (Part 1 and Part 2)
  updateMedianTaps(calibrationPart: CalibrationPartType, value: number): void {
    this.state.medianTaps[calibrationPart] = value;
  }

  // Increase the number of failures for a specific validation part
  increaseValidationFailures(validationPart: ValidationPartType): void {
    this.state.validationState.failures[validationPart] += 1;
  }

  // Mark calibration as failed or successful
  setCalibrationPassed(calibrationPart: CalibrationPartType): void {
    this.state.calibrationPartsPassed[calibrationPart] = true;
  }

  // Update validation success or extra validation requirements
  setExtraValidationRequired(required: boolean): void {
    this.state.validationState.extraValidationRequired = required;
  }

  // Update to say that the validation has been completed successfully
  setValidationSuccess(successful: boolean): void {
    this.state.validationState.validationSuccess = successful;
  }

  // Increment demo trial successes
  incrementDemoTrialSuccesses(): void {
    this.state.demoTrialSuccesses += 1;
  }

  // Increment the number of completed blocks
  incrementCompletedBlocks(): void {
    this.state.completedBlockCount += 1;
  }

  // Increment the number of completed blocks
  incrementNumberPracticeLoopsCompleted(): void {
    this.state.numberOfPracticeLoopsCompleted += 1;
  }

  // Increment the number of completed blocks
  incrementCalibrationSuccesses(calibrationPart: CalibrationPartType): void {
    this.state.currentCalibrationStepSuccesses[calibrationPart] += 1;
  }

  updateCalibrationSuccesses(
    calibrationPart: CalibrationPartType,
    successes: number,
  ): void {
    this.state.currentCalibrationStepSuccesses[calibrationPart] = successes;
  }

  resetDemoTrialSuccesses(): void {
    this.state.demoTrialSuccesses = 0;
  }

  // Reset the state for a new experiment
  resetState(): void {
    this.state = {
      medianTaps: defaultCurrentTrialsCalibration,
      currentCalibrationStepSuccesses: defaultCurrentTrialsCalibration,
      calibrationPartsPassed: defaultCalibrationPartsPassed,
      validationState: defaultValidationState,
      failedMinimumDemoTapsTrial: 0,
      demoTrialSuccesses: 0,
      completedBlockCount: 1,
      numberOfPracticeLoopsCompleted: 1,
      userID: '',
    };
  }

  getProgressBarStatus(
    state: 'practice' | 'calibration' | 'validation' | 'block' | 'finalCal',
    trialBlock?: number,
  ): number {
    const totalSections =
      4 +
      this.settings.taskSettings.taskBlockRepetitions *
        this.settings.taskSettings.taskBlocksIncluded.length;
    switch (state) {
      case 'practice':
        return 0;
      case 'calibration':
        return 1 / totalSections;
      case 'validation':
        return 2 / totalSections;
      case 'block':
        if (trialBlock) {
          return (3 + trialBlock) / totalSections;
        }
        return 3 / totalSections;
      case 'finalCal':
        return (totalSections - 1) / totalSections;
      default:
        return 0;
    }
  }
}
