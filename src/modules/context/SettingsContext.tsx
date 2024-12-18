import { FC, ReactElement, createContext, useContext } from 'react';

import { hooks, mutations } from '../../config/queryClient';
import Loader from '../common/Loader';
import {
  BoundsType,
  CalibrationPartType,
  DelayType,
  RewardType,
} from '../experiment/utils/types';

export type GeneralSettingsType = {
  usePhotoDiode: 'top-left' | 'top-right' | 'off';
};

export type PracticeSettingsType = {
  numberOfPracticeLoops: number;
};

export type CalibrationSettingsType = {
  requiredTrialsCalibration: {
    [key in CalibrationPartType]: number;
  };
  minimumCalibrationMedianTaps: number;
};

export type ValidationSettingsType = {
  numberOfValidationsPerType: number;
  percentageOfValidationSuccessesRequired: number;
  percentageOfExtraValidationSuccessesRequired: number;
};

export type TaskSettingsType = {
  taskBlocksIncluded: DelayType[];
  taskBoundsIncluded: BoundsType[];
  taskRewardsIncluded: RewardType[];
  taskBlockRepetitions: number;
  taskPermutationRepetitions: number;
  randomSkipChance: number;
};

// mapping between Setting names and their data type
export type AllSettingsType = {
  generalSettings: GeneralSettingsType;
  practiceSettings: PracticeSettingsType;
  calibrationSettings: CalibrationSettingsType;
  validationSettings: ValidationSettingsType;
  taskSettings: TaskSettingsType;
};
// default values for the data property of settings by name
const defaultSettingsValues: AllSettingsType = {
  generalSettings: {
    usePhotoDiode: 'off',
  },
  practiceSettings: {
    numberOfPracticeLoops: 0,
  },
  calibrationSettings: {
    minimumCalibrationMedianTaps: 10,
    requiredTrialsCalibration: {
      [CalibrationPartType.CalibrationPart1]: 1,
      [CalibrationPartType.CalibrationPart2]: 1,
      [CalibrationPartType.FinalCalibrationPart1]: 1,
      [CalibrationPartType.FinalCalibrationPart2]: 1,
    },
  },
  validationSettings: {
    numberOfValidationsPerType: 1,
    percentageOfExtraValidationSuccessesRequired: 50,
    percentageOfValidationSuccessesRequired: 75,
  },
  taskSettings: {
    taskBlockRepetitions: 1,
    taskPermutationRepetitions: 1,
    taskBlocksIncluded: [DelayType.Sync, DelayType.WideAsync],
    taskBoundsIncluded: [BoundsType.Easy, BoundsType.Hard],
    taskRewardsIncluded: [RewardType.Low, RewardType.High],
    randomSkipChance: 0,
  },
};

// list of the settings names
const ALL_SETTING_NAMES = [
  'generalSettings',
  'practiceSettings',
  'calibrationSettings',
  'validationSettings',
  'taskSettings',
] as const;

// automatically generated types
type AllSettingsNameType = (typeof ALL_SETTING_NAMES)[number];
type AllSettingsDataType = AllSettingsType[keyof AllSettingsType];

export type SettingsContextType = AllSettingsType & {
  saveSettings: (
    name: AllSettingsNameType,
    newValue: AllSettingsDataType,
  ) => void;
};

const defaultContextValue = {
  ...defaultSettingsValues,
  saveSettings: () => null,
};

const SettingsContext = createContext<SettingsContextType>(defaultContextValue);

type Prop = {
  children: ReactElement | ReactElement[];
};

export const SettingsProvider: FC<Prop> = ({ children }) => {
  const { mutate: postAppSetting } = mutations.usePostAppSetting();
  const { mutate: patchAppSetting } = mutations.usePatchAppSetting();
  const {
    data: appSettingsList,
    isLoading,
    isSuccess,
  } = hooks.useAppSettings();

  const saveSettings = (
    name: AllSettingsNameType,
    newValue: AllSettingsDataType,
  ): void => {
    if (appSettingsList) {
      const previousSetting = appSettingsList.find((s) => s.name === name);
      // setting does not exist
      if (!previousSetting) {
        postAppSetting({
          data: newValue,
          name,
        });
      } else {
        patchAppSetting({
          id: previousSetting.id,
          data: newValue,
        });
      }
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  const getContextValue = (): SettingsContextType => {
    if (isSuccess) {
      const allSettings: AllSettingsType = ALL_SETTING_NAMES.reduce(
        <T extends AllSettingsNameType>(acc: AllSettingsType, key: T) => {
          const setting = appSettingsList.find((s) => s.name === key);
          if (setting) {
            const settingData =
              setting?.data as unknown as AllSettingsType[typeof key];
            acc[key] = settingData;
          } else {
            acc[key] = defaultSettingsValues[key];
          }
          return acc;
        },
        defaultSettingsValues,
      );
      return {
        ...allSettings,
        saveSettings,
      };
    }
    return defaultContextValue;
  };

  const contextValue = getContextValue();

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType =>
  useContext<SettingsContextType>(SettingsContext);
