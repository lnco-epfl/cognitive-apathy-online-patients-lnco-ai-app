import { AllSettingsType } from '../context/SettingsContext';

export type ExperimentResult = {
  settings?: AllSettingsType;
  rawData?: { trials: TrialData[] };
};

export type TrialData = {
  trialBlocksSequencing?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
