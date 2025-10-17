import {
  boundsSortOrder,
  delaySortOrder,
  rewardSortOrder,
} from '@/modules/config/appSettings';
import {
  AgencyTaskSettingsType,
  AllSettingsType,
  CalibrationSettingsType,
  GeneralSettingsType,
  NextStepSettings,
  PhotoDiodeSettings,
  PracticeSettingsType,
  TaskSettingsType,
  ValidationSettingsType,
} from '@/modules/context/SettingsContext';

import {
  BoundsType,
  CalibrationPartType,
  DelayType,
  ExtendedKeySettings,
  Phase,
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
  validationTargetFailures: number;
  validationHardFailures: number;
  extraValidationRequired: boolean;
};

interface State {
  tappingHand: 'left' | 'right';
  medianTaps: MedianTapsType;
  previousReward: number;
  currentCalibrationStepSuccesses: CurrentCalibrationStepSuccessesType;
  calibrationPartsPassed: CalibrationPartsPassedType;
  validationState: ValidationStateType;
  failedMinimumDemoTapsTrial: number;
  completedBlockCount: number;
  numberOfPracticeLoopsCompleted: number;
  patchStatus: 'pending' | 'success' | 'failed';
  phase: Phase;
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
  validationHardFailures: 0,
  validationTargetFailures: 0,
};

// Step 2: Create the ExperimentState class
export class ExperimentState {
  // Define a single "variables" object to store the state
  private state: State;

  private settings: AllSettingsType;

  constructor(settingsVariables: AllSettingsType) {
    // Initialize all the state variables in the constructor
    this.state = {
      tappingHand: 'right',
      medianTaps: defaultMedianTaps,
      currentCalibrationStepSuccesses: defaultCurrentTrialsCalibration,
      calibrationPartsPassed: defaultCalibrationPartsPassed,
      validationState: defaultValidationState,
      failedMinimumDemoTapsTrial: 0,
      previousReward: 0,
      completedBlockCount: 1,
      numberOfPracticeLoopsCompleted: 0,
      phase: 'introduction',
      userID: '',
      patchStatus: 'success',
    };
    this.settings = {
      generalSettings: {
        fontSize: settingsVariables.generalSettings.fontSize || 'normal',
        useDevice: settingsVariables.generalSettings.useDevice || false,
      },
      practiceSettings: {
        numberOfPracticeLoops:
          settingsVariables.practiceSettings.numberOfPracticeLoops || 1,
      },
      languageSettings: {
        language: settingsVariables.languageSettings.language || 'en',
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
      agencyTaskSettings: {
        numberOfPracticeTrials:
          settingsVariables.agencyTaskSettings.numberOfPracticeTrials || 1,
        breakFrequency:
          settingsVariables.agencyTaskSettings.breakFrequency || 10,
        conditionRepetitions:
          settingsVariables.agencyTaskSettings.conditionRepetitions || 10,
        maxDelay: settingsVariables.agencyTaskSettings.maxDelay || 1000,
        numberOfDelayConditions:
          settingsVariables.agencyTaskSettings.numberOfDelayConditions || 4,
        allowBreakSkip:
          settingsVariables.agencyTaskSettings.allowBreakSkip || true,
        breakDuration:
          settingsVariables.agencyTaskSettings.breakDuration || 30000,
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
      photoDiodeSettings: {
        usePhotoDiode:
          settingsVariables.photoDiodeSettings.usePhotoDiode || 'off',
        photoDiodeLeft:
          settingsVariables.photoDiodeSettings.photoDiodeLeft || undefined,
        photoDiodeTop:
          settingsVariables.photoDiodeSettings.photoDiodeTop || undefined,
        photoDiodeWidth:
          settingsVariables.photoDiodeSettings.photoDiodeWidth || undefined,
        photoDiodeHeight:
          settingsVariables.photoDiodeSettings.photoDiodeHeight || undefined,
        testPhotoDiode:
          settingsVariables.photoDiodeSettings.testPhotoDiode || undefined,
      },
      keySettings: settingsVariables.keySettings || {
        leftIndex: 's',
        rightIndex: 'l',
      },
      nextStepSettings: settingsVariables.nextStepSettings || {
        linkToNextPage: false,
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

  getAgencyTaskSettings(): AgencyTaskSettingsType {
    return this.settings.agencyTaskSettings;
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

  getPhotoDiodeSettings(): PhotoDiodeSettings {
    return this.settings.photoDiodeSettings;
  }

  getKeySettings(): ExtendedKeySettings {
    return {
      ...this.settings.keySettings,
      preferredHand: this.state.tappingHand,
    };
  }

  getNextStepSettings(): NextStepSettings {
    return this.settings.nextStepSettings;
  }

  getCurrentSuccesses = (calibrationPart: CalibrationPartType): number =>
    this.state.currentCalibrationStepSuccesses[calibrationPart];

  getRequiredSuccesses = (calibrationPart: CalibrationPartType): number =>
    this.settings.calibrationSettings.requiredTrialsCalibration[
      calibrationPart
    ];

  getPatchStatus = (): 'pending' | 'success' | 'failed' =>
    this.state.patchStatus;

  setPatchStatus = (status: 'pending' | 'success' | 'failed'): void => {
    this.state.patchStatus = status;
  };

  getPreferredHand = (): string => this.state.tappingHand;

  setPreferredHand = (hand: 'left' | 'right'): void => {
    this.state.tappingHand = hand;
  };

  setPreviousReward = (reward: number): void => {
    this.state.previousReward = reward;
  };

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

  // Increase the number of failures for validations missing the target
  increaseValidationTargetFailures(): void {
    this.state.validationState.validationTargetFailures += 1;
  }

  // Increase the number of failures for validations missing the target
  increaseValidationHardFailures(): void {
    this.state.validationState.validationHardFailures += 1;
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

  setFontSize(fontSize: string): void {
    this.settings.generalSettings.fontSize = fontSize as
      | 'small'
      | 'normal'
      | 'large'
      | 'extra-large';
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

  setMedianTaps(medianTaps: MedianTapsType): void {
    this.state.medianTaps = medianTaps;
  }

  setInstructionPhase(phase: Phase): void {
    this.state.phase = phase;
  }

  updateCalibrationSuccesses(
    calibrationPart: CalibrationPartType,
    successes: number,
  ): void {
    this.state.currentCalibrationStepSuccesses[calibrationPart] = successes;
  }

  // Reset the state for a new experiment
  resetState(): void {
    this.state = {
      tappingHand: 'right',
      medianTaps: defaultCurrentTrialsCalibration,
      currentCalibrationStepSuccesses: defaultCurrentTrialsCalibration,
      calibrationPartsPassed: defaultCalibrationPartsPassed,
      validationState: defaultValidationState,
      failedMinimumDemoTapsTrial: 0,
      completedBlockCount: 1,
      previousReward: 0,
      numberOfPracticeLoopsCompleted: 1,
      phase: 'introduction',
      userID: '',
      patchStatus: 'success',
    };
  }
}
