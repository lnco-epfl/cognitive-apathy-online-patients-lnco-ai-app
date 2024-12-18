/* eslint-disable */
import { FC, useEffect, useRef } from 'react';

import { DataCollection, JsPsych } from 'jspsych';

import useExperimentResults from '../context/ExperimentContext';
import { AllSettingsType, useSettings } from '../context/SettingsContext';
import { run } from '../experiment/experiment';

export const ExperimentLoader: FC = () => {
  const settings = useSettings();

  const jsPsychRef = useRef<null | Promise<JsPsych>>(null);

  const { status, experimentResultsAppData, setExperimentResult } =
    useExperimentResults();

  const updateData = (
    rawData: DataCollection,
    settings: AllSettingsType,
  ): void => {
    let responseArray = [];
    if (experimentResultsAppData && experimentResultsAppData.rawData?.trials) {
      if (experimentResultsAppData.rawData.trials.length <= rawData.count()) {
        responseArray = rawData.values();
      } else {
        responseArray = [
          ...rawData.values(),
          ...experimentResultsAppData.rawData.trials.slice(
            rawData.values().length,
          ),
        ];
      }
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

  useEffect(() => {
    if (status === 'success' && !experimentResultsAppData) {
      setExperimentResult({
        rawData: { trials: [] },
        settings,
      });
    }
    if (!jsPsychRef.current && experimentResultsAppData) {
      jsPsychRef.current = run({
        assetPaths: assetPath,
        input: { settings, results: experimentResultsAppData },
        updateData,
      });
    }
  }, [experimentResultsAppData, status]);

  return <div id="jspsych-display-element" />;
};
