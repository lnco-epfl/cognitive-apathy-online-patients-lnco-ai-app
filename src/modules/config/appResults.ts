import { AllSettingsType } from '../context/SettingsContext';

export type ExperimentResult = {
  settings?: AllSettingsType;
  rawData?: { trials: object[] };
};
