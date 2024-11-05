/* eslint-disable */
import { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { useLocalContext } from '@graasp/apps-query-client';
import { AppData } from '@graasp/sdk';

import { DataCollection, JsPsych } from 'jspsych';
import { isEqual } from 'lodash';

import { hooks, mutations } from '@/config/queryClient';

import { ExperimentResult } from '../config/appResults';
import { AllSettingsType, useSettings } from '../context/SettingsContext';
import { run } from '../experiment/experiment';

export const ExperimentLoader: FC = () => {
  const { mutate: postAppData } = mutations.usePostAppData();
  const { mutate: patchAppData } = mutations.usePatchAppData();
  const { data: appDataList, isLoading: appDataLoading } =
    hooks.useAppData<ExperimentResult>();
  const { memberId: participantId } = useLocalContext();
  const settings = useSettings();

  const jsPsychRef = useRef<null | Promise<JsPsych>>(null);
  const dataRef = useRef<null | DataCollection>(null);
  const appDataListRef = useRef(appDataList);
  const currentAppDataRef = useRef(
    appDataListRef.current
      ?.filter((appData) => appData.type === 'tapping')
      .findLast((appData) => {
        // @ts-ignore
        return appData.account.id === participantId;
      }),
  );

  useEffect(() => {
    appDataListRef.current = appDataList;
    currentAppDataRef.current = appDataListRef.current
      ?.filter((appData) => appData.type === 'tapping')
      // @ts-ignore
      .findLast((appData) => appData.account.id === participantId);
  }, [appDataList, participantId]);

  const updateData = (
    rawData: DataCollection,
    settings: AllSettingsType,
  ): void => {
    if (!dataRef.current) {
      postAppData({
        data: { settings, rawData },
        type: 'tapping',
      });
      dataRef.current = Object.create(rawData);
    } else if (
      currentAppDataRef.current &&
      !isEqual(currentAppDataRef.current.data, rawData)
    ) {
      patchAppData({
        data: { settings, rawData },
        id: currentAppDataRef.current.id,
      });
      dataRef.current = rawData;
    }
    //}
  };

  const assetPath = {
    images: [
      'assets/images/hand.png',
      'assets/images/left.jpg',
      'assets/images/right.jpg',
      'assets/images/tip.png',
    ],
    audio: [],
    video: [
      'assets/videos/calibration-2-video.mp4',
      'assets/videos/calibration-part1.mp4',
      'assets/videos/calibration-part2.mp4',
      'assets/videos/tutorial_video_no_stimuli.mp4',
      'assets/videos/validation-video.mp4',
      'assets/videos/validation.mp4',
    ],
    misc: ['assets/locales/en/ns1.json', 'assets/locales/fr/ns1.json'],
  };

  useEffect(() => {
    if (!jsPsychRef.current && settings) {
      console.log(`In Experiment Component`);
      jsPsychRef.current = run({
        assetPaths: assetPath,
        input: settings,
        updateData: updateData,
      });
    }
  }, []);

  return (
    <div>
      <div className="jspsych-content-wrapper">
        <div id="jspsych-content" className="jspsych-content" />
      </div>
    </div>
  );
};
