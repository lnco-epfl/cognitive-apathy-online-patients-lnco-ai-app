import {
  FC,
  ReactElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useLocalContext } from '@lnco-ai/apps-query-client';
import { PermissionLevel, PermissionLevelCompare } from '@lnco-ai/sdk';
import { sortBy } from 'lodash';

import {
  AppDataType,
  ExperimentResultsAppData,
  getDefaultExperimentResultAppData,
} from '../../config/appData';
import { hooks, mutations } from '../../config/queryClient';
import { ExperimentResult } from '../config/appResults';

type ExperimentContextType = {
  experimentResultsAppData?: ExperimentResult;
  setExperimentResult: (experimentResult: ExperimentResult) => Promise<boolean>;
  deleteExperimentResult: (id?: ExperimentResultsAppData['id']) => void;
  allExperimentResultsAppData?: ExperimentResultsAppData[];
  status: 'loading' | 'error' | 'success';
};

const defaultContextValue: ExperimentContextType = {
  setExperimentResult: async () => false,
  deleteExperimentResult: () => null,
  status: 'loading',
};

const ExperimentResultsContext =
  createContext<ExperimentContextType>(defaultContextValue);

export const ExperimentResultsProvider: FC<{
  children: ReactElement | ReactElement[];
}> = ({ children }) => {
  const { data, isSuccess, status } = hooks.useAppData<ExperimentResult>({
    type: AppDataType.ExperimentResults,
  });

  const [experimentResultsAppData, setExperimentResultsAppData] =
    useState<ExperimentResultsAppData>();
  const [allExperimentResultsAppData, setAllExperimentResultsAppData] =
    useState<ExperimentResultsAppData[]>();

  const cachePayload = useRef<ExperimentResult>();
  // const debouncedPatch = useRef<ReturnType<typeof debounce>>();
  const hasPosted = useRef<boolean>(false);
  const { mutateAsync: postAppData } = mutations.usePostAppData();
  const { mutateAsync: patchAppData } = mutations.usePatchAppData();
  const { mutate: deleteAppData } = mutations.useDeleteAppData();
  const { permission, accountId } = useLocalContext();

  const isAdmin = useMemo(
    () => PermissionLevelCompare.gte(permission, PermissionLevel.Admin),
    [permission],
  );

  useEffect(() => {
    if (isSuccess) {
      const allIns = data.filter(
        (d) => d.type === AppDataType.ExperimentResults,
      ) as ExperimentResultsAppData[];
      setAllExperimentResultsAppData(allIns);
      setExperimentResultsAppData(
        sortBy(allIns, ['createdAt'])
          .reverse()
          .find((d) => d.account?.id === accountId),
      );
    }
  }, [isSuccess, data, accountId]);

  useEffect(() => {
    if (isSuccess && experimentResultsAppData) {
      hasPosted.current = true;
    }
  });

  const setExperimentResult = useMemo(
    () =>
      async (experimentResults: ExperimentResult): Promise<boolean> => {
        const payloadData = experimentResults;

        if (!isSuccess) {
          return false;
        }

        try {
          if (hasPosted.current) {
            if (experimentResultsAppData?.id) {
              cachePayload.current = payloadData;
              await patchAppData({
                ...experimentResultsAppData,
                data: cachePayload.current,
              });
              return true;
            }
          } else {
            await postAppData(getDefaultExperimentResultAppData(payloadData));
            hasPosted.current = true;
            return true;
          }

          return false;
        } catch (error) {
          console.warn('Failed to update experiment result:', error);
          return false;
        }
      },
    [isSuccess, patchAppData, postAppData, experimentResultsAppData],
  );

  const deleteExperimentResult = useMemo(
    () =>
      (id?: ExperimentResultsAppData['id']): void => {
        if (id) {
          deleteAppData({ id });
        } else if (experimentResultsAppData) {
          deleteAppData({ id: experimentResultsAppData?.id });
        }
        setExperimentResultsAppData(undefined);
        hasPosted.current = false;
      },
    [deleteAppData, experimentResultsAppData],
  );
  const contextValue = useMemo(
    () => ({
      experimentResultsAppData: experimentResultsAppData?.data,
      setExperimentResult,
      allExperimentResultsAppData: isAdmin
        ? allExperimentResultsAppData
        : undefined,
      deleteExperimentResult,
      status: allExperimentResultsAppData === undefined ? 'loading' : status,
    }),
    [
      allExperimentResultsAppData,
      deleteExperimentResult,
      isAdmin,
      setExperimentResult,
      status,
      experimentResultsAppData,
    ],
  );

  return (
    <ExperimentResultsContext.Provider value={contextValue}>
      {children}
    </ExperimentResultsContext.Provider>
  );
};

const useExperimentResults = (): ExperimentContextType =>
  useContext(ExperimentResultsContext);

export default useExperimentResults;
