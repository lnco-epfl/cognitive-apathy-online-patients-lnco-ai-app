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

  // Function to retreive remaining trial blocks in the experiment, in case previously performed
  const getRemainingTrialBlocks = (trials: TrialData[]): DelayType[] => {
    // Retreive trail block sequencing as generated an stored in data
    const trialBlockDescription = trials.find(
      (trial: TrialData) => trial.trialBlocksSequencing !== undefined,
    );
    // Retreive last "Total Reward" object to figure out # of completed blocks
    const lastRewardIndex = trials.filter(
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
    // Find the index of the last trial that contains "totalReward" (last completed block)
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

  // Function to determine if the experiment was previously completed (all blocks completed)
  const isCompleted = (
    trials: TrialData[],
    currentSettings: AllSettingsType,
  ): boolean => {
    const blocksCompleted = trials.filter(
      (trial: TrialData) => trial.totalReward !== undefined,
    );
    return (
      blocksCompleted.length >=
      currentSettings.taskSettings.taskBlocksIncluded.length *
        currentSettings.taskSettings.taskBlockRepetitions
    );
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
      // Circumstance 1: Participant has not previously started the experiment --> Render jsPsych
      if (experimentResultsAppData.rawData?.trials.length === 0) {
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
        // Circumstance 2: Participant has previously completed the experiment --> Show Experiment completed screen
      } else if (
        isCompleted(experimentResultsAppData.rawData.trials, settings)
      ) {
        setCompletedContent(
          <Typography variant="h5" style={{ backgroundColor: 'white' }}>
            You have previously completed this experiment, please reach out to
            the experimenter if this is not correct.
          </Typography>,
        );
        // Circumstance 3/4: Participant has previously started the experiment, but not completed it
      } else {
        // Retreive remainingTrialBlocks from the experimentResult data
        const remainingTrialBlocks = getRemainingTrialBlocks(
          experimentResultsAppData.rawData.trials,
        );
        // Circumstance 3: If the particpant has completed at least one block, but not all blocks, start at the beginning of the last uncompleted block
        if (
          remainingTrialBlocks &&
          remainingTrialBlocks.length > 0 &&
          remainingTrialBlocks.length <
            settings.taskSettings.taskBlockRepetitions *
              settings.taskSettings.taskBlocksIncluded.length
        ) {
          const oldData = getOldData(experimentResultsAppData.rawData.trials);
          jsPsychRef.current = run({
            assetPaths: assetPath,
            input: {
              settings,
              results: experimentResultsAppData,
              participantName,
              remainingTrialBlocks,
              medianTaps: getMedainTaps(oldData),
            },
            updateData: (data, instanceSettings) =>
              updateData(data, instanceSettings, oldData),
          });
          // Circumstance 4: If the particpant did not complete any block, restart the experiment from scratch
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
