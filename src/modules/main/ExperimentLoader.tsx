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
import { DelayType, ReloadObject } from '../experiment/utils/types';

export const ExperimentLoader: FC = () => {
  // Retreive Settings and Experiment Result from Context
  const settings = useSettings();
  const { status, experimentResultsAppData, setExperimentResult } =
    useExperimentResults();

  // Retreive participant name using member ID and appContext
  const { memberId } = useLocalContext();
  const { data: appContextData } = hooks.useAppContext();
  let participantName = '';
  if (appContextData?.members) {
    participantName =
      appContextData.members.find((member) => member.id === memberId)?.name ??
      '';
  }

  // Create a reference object for the JsPsych Experiment, to ensure it is only loaded once
  const jsPsychRef = useRef<null | Promise<JsPsych>>(null);

  // Function to retreive "Median Taps" in case participant previously started the experiment
  const getMedianTaps = (trials: TrialData[]): MedianTapsType => {
    let medianTaps = defaultMedianTaps;
    const lastObjectWithMedianTaps = [...trials]
      .slice()
      .find((trial) => 'medianTaps' in trial);

    if (lastObjectWithMedianTaps) {
      medianTaps = lastObjectWithMedianTaps.medianTaps as MedianTapsType;
    }
    return medianTaps;
  };

  // Function to retreive remaining trial blocks in the experiment, in case previously performed
  const getRemainingTrialBlocks = (trials: TrialData[]): DelayType[] => {
    // Retreive trail block sequencing as generated an stored in data
    const trialBlockDescription = trials.find(
      (trial: TrialData) => trial.trialBlocksSequencing !== undefined,
    );
    // Retreive last "Total Reward" object to figure out # of completed blocks
    const lastRewardIndex = [...trials].filter(
      (trial: TrialData) => trial.totalReward !== undefined,
    );

    if (!trialBlockDescription) {
      console.warn('No trialBlocksSequencing found in trials.');
      return [];
    }

    // Determine remaining unfinished blocks from original block sequencing
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

  // Function to retreive Old Data from completed trial blocks ("trim" unfinished trial blocks and restart them)
  const getOldData = (trials: TrialData[]): object[] => {
    // Find the last checkpoint trial
    const lastCheckpointTrial = [...trials]
      .reverse()
      .find((trial) => trial.checkpoint !== undefined);
    // Find the index of that trial in the original array
    const lastCheckpointIndex = trials.findIndex(
      (trial) => trial.trial_index === lastCheckpointTrial?.trial_index,
    );
    return trials.slice(0, lastCheckpointTrial ? lastCheckpointIndex + 1 : 0);
  };

  // Function to determine if the experiment was previously completed (all blocks completed)
  const isCompleted = (trials: TrialData[]): boolean => {
    const finalMedianTaps = [...trials]
      .reverse()
      .filter((trial: TrialData) => trial.medianTaps !== undefined);
    return finalMedianTaps[0]?.medianTaps.finalCalibrationPart2Median;
  };

  const reloadExperiment = (trials: TrialData[]): TrialData | null => {
    // Find the last trial that contains "checkpoint"

    const lastCheckpointTrial = [...trials]
      .reverse()
      .find((trial) => trial.checkpoint !== undefined);

    // If checkpoint is in EBDM or Agency Task (end of block 1) --> reload experiment
    if (
      lastCheckpointTrial &&
      ((lastCheckpointTrial.checkpoint === 'EBDM' &&
        lastCheckpointTrial.checkpointBlock > 0) ||
        lastCheckpointTrial.checkpoint === 'agency' ||
        lastCheckpointTrial.checkpoint === 'final-calibration')
    ) {
      return lastCheckpointTrial;
    }
    return null;
  };

  const getCurrentTotalReward = (trials: TrialData[]): number => {
    // Find the last trial that contains "totalReward"
    const lastTotalRewardTrial = [...trials]
      .reverse()
      .find((trial) => trial.totalReward !== undefined);
    if (lastTotalRewardTrial) {
      return lastTotalRewardTrial.totalReward as number;
    }
    return 0;
  };

  const getPreferredHand = (trials: TrialData[]): 'left' | 'right' => {
    // Find the preferred hand trial from the introduction (beginning of experiment)
    const preferredHandTrial = [...trials].find(
      (trial) => (trial as TrialData).preferredHand !== undefined,
    );
    if (preferredHandTrial) {
      return preferredHandTrial.preferredHand as 'left' | 'right';
    }
    return 'right'; // Default to right if not found
  };

  const [completedContent, setCompletedContent] = useState<JSX.Element | null>(
    null,
  );

  // useEffect for rendering the jsPsych experiment exactly once
  useEffect(() => {
    // Create the assetPath object to send to the jspsych experiment
    // TODO: update assetPath
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

    // Create the function that "sends back" the experiment data in the jsPsych experiment for storage in the DB
    const updateData = (
      rawData: DataCollection,
      instanceSettings: AllSettingsType,
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
        settings: instanceSettings,
      });
    };

    // Prerequisite for rendering: if participant has no past "ExperimentResult", create a new result with the current settings
    // (success === true ensures the result is loaded correctly)
    if (status === 'success' && !experimentResultsAppData) {
      setExperimentResult({
        rawData: { trials: [] },
        settings,
      });
    }

    // The following sequence ensures that the jsPsych is rendered correctly depending on various 'circumstances'
    // First, ensure that the jsPsych has not already been started, and that experimentResult exists
    if (!jsPsychRef.current && experimentResultsAppData?.rawData) {
      // Circumstance 1: Participant has previously completed the experiment --> Show Experiment completed screen
      if (isCompleted(experimentResultsAppData.rawData.trials)) {
        setCompletedContent(
          <Typography variant="h5" style={{ backgroundColor: 'white' }}>
            You have previously completed this experiment, please reach out to
            the experimenter if this is not correct.
          </Typography>,
        );
      } else {
        const checkpointTrial = reloadExperiment(
          experimentResultsAppData.rawData.trials,
        );

        // Circumstance 2: Participant has previously reached a relevant checkpoint --> Render jsPsych from that point
        if (checkpointTrial) {
          // Circumstance 2a EBDM checkpoint reached (and at least one block completed) --> restart from EBDM
          if (
            checkpointTrial.checkpoint === 'EBDM' &&
            checkpointTrial.checkpointBlock <
              settings.taskSettings.taskBlockRepetitions *
                settings.taskSettings.taskBlocksIncluded.length
          ) {
            const remainingTrialBlocks = getRemainingTrialBlocks(
              experimentResultsAppData.rawData.trials,
            );
            const oldData = getOldData(experimentResultsAppData.rawData.trials);
            const totalReward = getCurrentTotalReward(
              experimentResultsAppData.rawData.trials,
            );
            const reloadObject: ReloadObject = {
              phase: 'EBDM',
              medianTaps: getMedianTaps(
                experimentResultsAppData.rawData.trials,
              ),
              preferredHand: getPreferredHand(
                experimentResultsAppData.rawData.trials,
              ),
              block: checkpointTrial.checkpointBlock,
              remainingTrialBlocks,
              totalReward,
            };
            jsPsychRef.current = run({
              assetPaths: assetPath,
              input: {
                settings,
                results: experimentResultsAppData,
                participantName,
                reloadObject,
              },
              updateData: (data, instanceSettings) =>
                updateData(data, instanceSettings, oldData),
            });
          }
          // Circumstance 2b Agency Task reached --> restart from Agency Task
          else if (
            checkpointTrial.checkpoint === 'agency' ||
            checkpointTrial.checkpointBlock ===
              settings.taskSettings.taskBlockRepetitions *
                settings.taskSettings.taskBlocksIncluded.length
          ) {
            const oldData = getOldData(experimentResultsAppData.rawData.trials);
            const totalReward = getCurrentTotalReward(
              experimentResultsAppData.rawData.trials,
            );
            const reloadObject: ReloadObject = {
              phase: 'agency',
              medianTaps: getMedianTaps(
                experimentResultsAppData.rawData.trials,
              ),
              totalReward,
              preferredHand: getPreferredHand(
                experimentResultsAppData.rawData.trials,
              ),
              block: checkpointTrial.checkpointBlock,
            };
            jsPsychRef.current = run({
              assetPaths: assetPath,
              input: {
                settings,
                results: experimentResultsAppData,
                participantName,
                reloadObject,
              },
              updateData: (data, instanceSettings) =>
                updateData(data, instanceSettings, oldData),
            });
          } else if (checkpointTrial.checkpoint === 'final-calibration') {
            const oldData = getOldData(experimentResultsAppData.rawData.trials);
            const totalReward = getCurrentTotalReward(
              experimentResultsAppData.rawData.trials,
            );
            const reloadObject: ReloadObject = {
              phase: 'final-calibration',
              medianTaps: getMedianTaps(
                experimentResultsAppData.rawData.trials,
              ),
              totalReward,
              preferredHand: getPreferredHand(
                experimentResultsAppData.rawData.trials,
              ),
              block: checkpointTrial.checkpointBlock,
            };
            jsPsychRef.current = run({
              assetPaths: assetPath,
              input: {
                settings,
                results: experimentResultsAppData,
                participantName,
                reloadObject,
              },
              updateData: (data, instanceSettings) =>
                updateData(data, instanceSettings, oldData),
            });
          }
        } else {
          jsPsychRef.current = run({
            assetPaths: assetPath,
            input: {
              settings,
              results: experimentResultsAppData,
              participantName,
            },
            updateData: (data, instanceSettings) =>
              updateData(data, instanceSettings, []),
          });
        }
      }
    }
  }, [
    experimentResultsAppData,
    participantName,
    setExperimentResult,
    settings,
    status,
  ]);

  if (completedContent) {
    return completedContent;
  }
  return <div id="jspsych-display-element" />;
};
