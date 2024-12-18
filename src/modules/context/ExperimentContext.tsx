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

import { useLocalContext } from '@graasp/apps-query-client';
import { PermissionLevel, PermissionLevelCompare } from '@graasp/sdk';

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
  setExperimentResult: (experimentResult: ExperimentResult) => void;
  deleteExperimentResult: (id?: ExperimentResultsAppData['id']) => void;
  allExperimentResultsAppData?: ExperimentResultsAppData[];
  status: 'loading' | 'error' | 'success';
};

const defaultContextValue: ExperimentContextType = {
  setExperimentResult: () => null,
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
  const { mutate: postAppData } = mutations.usePostAppData();
  const { mutate: patchAppData } = mutations.usePatchAppData();
  const { mutate: deleteAppData } = mutations.useDeleteAppData();
  const { permission, memberId } = useLocalContext();

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
          .find((d) => d.member.id === memberId),
      );
    }
  }, [isSuccess, data, memberId]);

  useEffect(() => {
    if (isSuccess && experimentResultsAppData) {
      hasPosted.current = true;
    }
  });

  const setExperimentResult = useMemo(
    () =>
      (experimentResults: ExperimentResult): void => {
        const payloadData = experimentResults;
        if (isSuccess) {
          if (hasPosted.current) {
            if (experimentResultsAppData?.id) {
              // Eventually useless
              cachePayload.current = payloadData;
              patchAppData({
                ...experimentResultsAppData,
                data: cachePayload.current,
              });
            }
          } else {
            postAppData(getDefaultExperimentResultAppData(payloadData));
            hasPosted.current = true;
          }
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
