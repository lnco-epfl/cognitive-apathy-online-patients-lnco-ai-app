import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { Typography } from '@mui/material';

import { useLocalContext } from '@graasp/apps-query-client';

import { DataCollection, JsPsych } from 'jspsych';
import { AudioNarration } from 'jspsych-audio-narration';

import { hooks } from '@/config/queryClient';

import { parseScreenCalibration } from '../../utils/screenCalibration';
import { TrialData } from '../config/appResults';
import useExperimentResults from '../context/ExperimentContext';
import { AllSettingsType, useSettings } from '../context/SettingsContext';
import { run } from '../experiment/experiment';
import {
  MedianTapsType,
  defaultMedianTaps,
} from '../experiment/jspsych/experiment-state-class';
import { DelayType, ReloadObject } from '../experiment/utils/types';

type Payload = {
  timestamp: number;
  participantName: string;
  data: { trials: TrialData[] };
};

interface ExperimentLoaderProps {
  narration: AudioNarration;
}

export const ExperimentLoader: FC<ExperimentLoaderProps> = ({ narration }) => {
  // Retreive Settings and Experiment Result from Context
  const settings = useSettings();
  const { status, experimentResultsAppData, setExperimentResult } =
    useExperimentResults();

  // Retreive participant name using member ID and appContext
  const { accountId, screenCalibration: rawCalibration } = useLocalContext();
  const screenCalibration = parseScreenCalibration(rawCalibration);
  const { data: appContextData } = hooks.useAppContext();
  let participantName = '';
  if (appContextData?.members) {
    participantName =
      appContextData.members.find((member) => member.id === accountId)?.name ??
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
    const lastCheckpointIndex =
      trials.length -
      [...trials]
        .reverse()
        .findIndex((trial) => trial.checkpoint !== undefined);
    return trials.slice(0, lastCheckpointIndex ? lastCheckpointIndex + 1 : 0);
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

  const loadFromLocalStorage = useCallback((): Payload | null => {
    try {
      const localStorageKey = participantName ?? 'default';
      const saved = localStorage.getItem(localStorageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [participantName]);

  const saveToLocalStorage = useCallback(
    (data: TrialData[]) => {
      try {
        const payload: Payload = {
          timestamp: Date.now(),
          participantName,
          data: { trials: data },
        };
        localStorage.setItem(participantName, JSON.stringify(payload));
      } catch (e) {
        console.warn('Failed to save progress locally', e);
      }
    },
    [participantName], // only redefined when participantName changes
  );

  const [completedContent, setCompletedContent] = useState<JSX.Element | null>(
    null,
  );

  const [loadingFromLocal, setLoadingFromLocal] = useState<boolean | null>(
    true,
  );

  useEffect(() => {
    if (status !== 'success' || !participantName || jsPsychRef.current) return;

    const localData = loadFromLocalStorage();
    const serverData = experimentResultsAppData?.rawData;

    if (localData) {
      console.info(
        'Local data found, comparing with server data if available...',
      );
      const localCheckpoint = reloadExperiment(localData.data.trials);
      const serverCheckpoint = reloadExperiment(serverData?.trials ?? []);

      // Case 1: Local has more progress than server → restore local
      if (
        localCheckpoint &&
        (!serverCheckpoint ||
          localCheckpoint.trial_index > (serverCheckpoint.trial_index ?? -1))
      ) {
        console.info(
          'Restoring from local checkpoint — local progress is newer',
        );
        setExperimentResult({ rawData: localData.data, settings });
      }

      // Case 2: Local has checkpoint, server doesn't → restore local
      else if (localCheckpoint && !serverCheckpoint) {
        console.info('Server has no checkpoint — restoring from local data');
        setExperimentResult({ rawData: localData.data, settings });
      }

      // Case 3: Local has less progress or equal → do nothing (use server)
      else {
        console.info('Server progress is equal or newer — keeping server data');
      }
    }

    // Case 4: No local data at all
    if (!localData) {
      if (serverData?.trials?.length) {
        console.info('Server data found — no need to restore');
      } else {
        console.info('No local or server data — starting new experiment');
        setExperimentResult({ rawData: { trials: [] }, settings });
      }
    }

    setLoadingFromLocal(false);
  }, [
    status,
    experimentResultsAppData,
    participantName,
    settings,
    loadFromLocalStorage,
    setExperimentResult,
  ]);

  // useEffect for rendering the jsPsych experiment exactly once
  useEffect(() => {
    // Early exit if not ready
    if (
      status !== 'success' ||
      !participantName ||
      loadingFromLocal ||
      jsPsychRef.current ||
      !experimentResultsAppData?.rawData
    ) {
      return;
    }

    const trials = experimentResultsAppData?.rawData?.trials ?? [];
    const hasData = trials.length > 0;

    // Create the assetPath object to send to the jspsych experiment
    const assetPath = {
      images: [
        'assets/images/hand-l-1.png',
        'assets/images/hand-l-2.png',
        'assets/images/hand-l-3.png',
        'assets/images/hand-r-1.png',
        'assets/images/hand-r-2.png',
        'assets/images/hand-r-3.png',
        'assets/images/offer.png',
        'assets/images/left.jpg',
        'assets/images/right.jpg',
        'assets/images/tip.png',
      ],
      audio: [
        'assets/audio/sit-comfortably.mp3',
        'assets/audio/tutorial-introduction.mp3',
        'assets/audio/dominant-hand.mp3',
        'assets/audio/instruction-hold-key-l.mp3',
        'assets/audio/instruction-hold-key-r.mp3',
        'assets/audio/instruction-tapping-l.mp3',
        'assets/audio/instruction-tapping-r.mp3',
        'assets/audio/hold-key-practice-l.mp3',
        'assets/audio/hold-key-practice-r.mp3',
        'assets/audio/hold-key-practice-completed.mp3',
        'assets/audio/hold-key-practice-done.mp3',
        'assets/audio/tapping-practice-l.mp3',
        'assets/audio/tapping-practice-r.mp3',
        'assets/audio/calibration-instruction-l.mp3',
        'assets/audio/calibration-instruction-r.mp3',
        'assets/audio/validation-instruction.mp3',
        'assets/audio/validation-completed.mp3',
        'assets/audio/likert-amf-preamble.mp3',
        'assets/audio/task-instructions-l.mp3',
        'assets/audio/task-instructions-r.mp3',
        'assets/audio/task-demo-introduction.mp3',
        'assets/audio/likert-demo-preamble.mp3',
        'assets/audio/task-reminder.mp3',
        'assets/audio/final-calibration-instruction-l.mp3',
        'assets/audio/final-calibration-instruction-r.mp3',
      ],
      video: [
        'assets/videos/calibration-part1.mp4',
        'assets/videos/calibration-part2.mp4',
        'assets/videos/validation-video.mp4',
        'assets/videos/validation.mp4',
        'assets/videos/practice-video-1-l.mp4',
        'assets/videos/practice-video-1-r.mp4',
        'assets/videos/practice-video-2-l.mp4',
        'assets/videos/practice-video-2-r.mp4',
        'assets/videos/practice-video-3-l.mp4',
        'assets/videos/practice-video-3-r.mp4',
        'assets/videos/practice-video-4-l.mp4',
        'assets/videos/practice-video-4-r.mp4',
      ],
      misc: ['assets/locales/en/ns1.json', 'assets/locales/fr/ns1.json'],
    };

    // Create the function that "sends back" the experiment data in the jsPsych experiment for storage in the DB
    const updateData = async (
      rawData: DataCollection,
      instanceSettings: AllSettingsType,
      oldData: object[],
    ): Promise<boolean> => {
      const responseArray = oldData.length
        ? [...oldData, ...rawData.values()]
        : rawData.values();

      saveToLocalStorage(responseArray);
      return setExperimentResult({
        rawData: { trials: responseArray },
        settings: instanceSettings,
      });
    };

    // Case 1: Participant already finished
    if (hasData && isCompleted(trials)) {
      console.info('Experiment already completed — showing completion message');
      setCompletedContent(
        <Typography variant="h5" style={{ backgroundColor: 'white' }}>
          You have previously completed this experiment, please reach out to the
          experimenter if this is not correct.
        </Typography>,
      );
      return;
    }

    // Case 2: Check if there is a valid reload checkpoint
    const checkpointTrial = hasData ? reloadExperiment(trials) : null;
    console.info(
      checkpointTrial
        ? `Checkpoint found at trial index ${checkpointTrial.trial_index} (checkpoint: ${checkpointTrial.checkpoint})`
        : 'No checkpoint found in existing data.',
    );
    if (checkpointTrial) {
      // --- Restore from checkpoint ---
      const phase = checkpointTrial.checkpoint as ReloadObject['phase'];
      const oldData = getOldData(trials);
      const totalReward = getCurrentTotalReward(trials);
      const medianTaps = getMedianTaps(trials);
      const preferredHand = getPreferredHand(trials);

      if (phase === 'EBDM') {
        const remainingTrialBlocks = getRemainingTrialBlocks(trials);
        const reloadObject: ReloadObject = {
          phase: 'EBDM',
          medianTaps,
          preferredHand,
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
            screenCalibration,
          },
          narration,
          updateDataPromise: (data, instanceSettings) =>
            updateData(data, instanceSettings, oldData),
        });
      } else if (phase === 'final-calibration' || phase === 'agency') {
        const reloadObject: ReloadObject = {
          phase: 'final-calibration',
          medianTaps,
          preferredHand,
          block: checkpointTrial.checkpointBlock,
          totalReward,
        };

        console.info(
          `Reloading at ${phase} phase with block ${checkpointTrial.checkpointBlock}, median taps: ${JSON.stringify(medianTaps)}, preferred hand: ${preferredHand}, total reward: ${totalReward}`,
        ); // Detailed log for debugging

        jsPsychRef.current = run({
          assetPaths: assetPath,
          input: {
            settings,
            results: experimentResultsAppData,
            participantName,
            reloadObject,
            screenCalibration,
          },
          narration,
          updateDataPromise: (data, instanceSettings) =>
            updateData(data, instanceSettings, oldData),
        });
      }
      return;
    }

    // Case 3: No checkpoint — start fresh.
    // If we reach this point:
    // - Either there’s no server data
    // - Or the participant never hit a checkpoint
    console.warn('Starting new experiment from blank slate');
    jsPsychRef.current = run({
      assetPaths: assetPath,
      input: {
        settings,
        results: { rawData: { trials: [] } }, // blank data set
        participantName,
        screenCalibration,
      },
      narration,
      updateDataPromise: (data, instanceSettings) =>
        updateData(data, instanceSettings, []),
    });

    if (
      status === 'success' &&
      !experimentResultsAppData?.rawData &&
      participantName &&
      !loadingFromLocal
    ) {
      console.warn('No existing data found; starting new experiment.');
      setExperimentResult({
        rawData: { trials: [] },
        settings,
      });
    }
  }, [
    experimentResultsAppData,
    loadingFromLocal,
    participantName,
    saveToLocalStorage,
    setExperimentResult,
    settings,
    status,
    screenCalibration,
    narration,
  ]);

  if (completedContent) {
    return completedContent;
  }
  return <div id="jspsych-display-element" />;
};
