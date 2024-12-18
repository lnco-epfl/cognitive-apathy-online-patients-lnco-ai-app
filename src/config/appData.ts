import { AppData, AppDataVisibility } from '@graasp/sdk';

import { ExperimentResult } from '@/modules/config/appResults';

export enum AppDataType {
  ExperimentResults = 'experiment-results',
}

export type ExperimentResultsAppData = AppData & {
  type: AppDataType.ExperimentResults;
  data: ExperimentResult;
  visibility: AppDataVisibility.Member;
};

export const getDefaultExperimentResultAppData = (
  experimentResult: ExperimentResult,
): Pick<ExperimentResultsAppData, 'data' | 'type' | 'visibility'> => ({
  type: AppDataType.ExperimentResults,
  data: experimentResult,
  visibility: AppDataVisibility.Member,
});
