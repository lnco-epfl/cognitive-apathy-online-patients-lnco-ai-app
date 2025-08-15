import { FC, useEffect, useRef, useState } from 'react';

import { Typography } from '@mui/material';

import { useLocalContext } from '@graasp/apps-query-client';

import { DataCollection, JsPsych } from 'jspsych';

import { hooks } from '@/config/queryClient';

import { TrialData } from '../config/appResults';
import useExperimentResults from '../context/ExperimentContext';
import { AllSettingsType, useSettings } from '../context/SettingsContext';
import { run } from '../experiment/experiment';
import {
  MedianTapsType,
  defaultMedianTaps,
} from '../experiment/jspsych/experiment-state-class';
import { DelayType } from '../experiment/utils/types';

export const ExperimentLoader: FC = () => {
  // Add function to decode experiment result -->
  /**
   * 1. Press here to continue
   * 2. Decide on next step
   *  - If before TB2 restart the whole experiment
   *  - If after TB2, restart at the beginning of the current trial block
   *  - If after last TB, no need to restart (no point in doing final callibration)
   * 3. Load required experiment location
   * 4. Perform updateData with the old data included (somehow)
   */
  const settings = useSettings();
  const { memberId } = useLocalContext();
  const { data: appContextData } = hooks.useAppContext();
  let participantName = '';

  if (appContextData?.members) {
    participantName =
      appContextData.members.find((member) => member.id === memberId)?.name ??
      '';
  }
  const jsPsychRef = useRef<null | Promise<JsPsych>>(null);

  const { status, experimentResultsAppData, setExperimentResult } =
    useExperimentResults();

  const getMedainTaps = (trials: TrialData[]): MedianTapsType => {
    let medianTaps = defaultMedianTaps;
    const lastObjectWithMedianTaps = trials
      .slice()
      .find((trial) => 'medianTaps' in trial);

    if (lastObjectWithMedianTaps) {
      medianTaps = lastObjectWithMedianTaps.medianTaps as MedianTapsType;
    }
    return medianTaps;
  };

  const getRemainingTrialBlocks = (trials: TrialData[]): DelayType[] => {
    const trialBlockDescription = trials.find(
      (trial: TrialData) => trial.trialBlocksSequencing !== undefined,
    );

    const lastRewardIndex = trials.filter(
      (trial: TrialData) => trial.totalReward !== undefined,
    );

    if (!trialBlockDescription) {
      console.warn('No trialBlocksSequencing found in trials.');
      return [];
    }
    if (trialBlockDescription.trialBlocksSequencing) {
      const delayTypeSequencing = trialBlockDescription.trialBlocksSequencing
        .map((item) =>
          Object.values(DelayType).includes(item as DelayType)
            ? (item as DelayType)
            : null,
        )
        .filter((item): item is DelayType => item !== null);
      if (
        lastRewardIndex !== undefined &&
        lastRewardIndex.length < delayTypeSequencing.length
      ) {
        return delayTypeSequencing.slice(lastRewardIndex.length);
      }
    }

    return [];
  };

  const getOldData = (trials: TrialData[]): object[] => {
    // Find the index of the last trial that contains "totalReward"
    const lastRewardIndex = trials
      .map((trial, index) => ({
        index,
        hasReward: (trial as TrialData).totalReward !== undefined,
      }))
      .filter((trial) => trial.hasReward)
      .map((trial) => trial.index)
      .pop(); // Get the last one

    // If no totalReward trial is found, return an empty array
    if (lastRewardIndex === undefined) return [];

    // Return the sliced array up to and including the last totalReward trial
    return trials.slice(0, lastRewardIndex + 1);
  };

  const isCompleted = (
    trials: TrialData[],
    // eslint-disable-next-line @typescript-eslint/no-shadow
    settings: AllSettingsType,
  ): boolean => {
    const blocksCompleted = trials.filter(
      (trial: TrialData) => trial.totalReward !== undefined,
    );
    return (
      blocksCompleted.length >=
      settings.taskSettings.taskBlocksIncluded.length *
        settings.taskSettings.taskBlockRepetitions
    );
  };

  const updateData = (
    rawData: DataCollection,
    // eslint-disable-next-line @typescript-eslint/no-shadow
    settings: AllSettingsType,
    oldData: object[],
  ): void => {
    let responseArray = [];
    if (oldData.length > 0) {
      responseArray = [...oldData, ...rawData.values()];
    } else {
      responseArray = rawData.values();
    }
    setExperimentResult({
      rawData: { trials: responseArray },
      settings,
    });
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

  const [completedContent, setCompletedContent] = useState<JSX.Element | null>(
    null,
  );

  useEffect(() => {
    let oldData: object[] = [];
    if (status === 'success' && !experimentResultsAppData) {
      setExperimentResult({
        rawData: { trials: [] },
        settings,
      });
    }
    if (!jsPsychRef.current && experimentResultsAppData?.rawData) {
      if (experimentResultsAppData.rawData?.trials.length === 0) {
        jsPsychRef.current = run({
          assetPaths: assetPath,
          input: {
            settings,
            results: experimentResultsAppData,
            participantName,
          },
          // eslint-disable-next-line @typescript-eslint/no-shadow
          updateData: (data, settings) => updateData(data, settings, []),
        });
      } else if (
        isCompleted(experimentResultsAppData.rawData.trials, settings)
      ) {
        setCompletedContent(
          <Typography variant="h5" style={{ backgroundColor: 'white' }}>
            You have previously completed this experiment, please reach out to
            the experimenter if this is not correct.
          </Typography>,
        );
      } else {
        oldData = getOldData(experimentResultsAppData.rawData.trials);
        const remainingTrialBlocks = getRemainingTrialBlocks(
          experimentResultsAppData.rawData.trials,
        );
        if (
          remainingTrialBlocks &&
          remainingTrialBlocks.length > 0 &&
          remainingTrialBlocks.length <
            settings.taskSettings.taskBlockRepetitions *
              settings.taskSettings.taskBlocksIncluded.length
        )
          jsPsychRef.current = run({
            assetPaths: assetPath,
            input: {
              settings,
              results: experimentResultsAppData,
              participantName,
              remainingTrialBlocks,
              medianTaps: getMedainTaps(oldData),
            },
            // eslint-disable-next-line @typescript-eslint/no-shadow
            updateData: (data, settings) => updateData(data, settings, oldData),
          });
        else {
          jsPsychRef.current = run({
            assetPaths: assetPath,
            input: {
              settings,
              results: experimentResultsAppData,
              participantName,
            },
            // eslint-disable-next-line @typescript-eslint/no-shadow
            updateData: (data, settings) => updateData(data, settings, []),
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [experimentResultsAppData, setExperimentResult, settings, status]);

  if (completedContent) {
    return completedContent;
  }
  return <div id="jspsych-display-element" />;
};
