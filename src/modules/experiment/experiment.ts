/**
 * @title Cognitive Apathy Experiment
 * @description This experiment aims to measure cognitive apathy using calibration and thermometer tasks.
 * @version 0.1.0
 *
 * @assets assets/
 */
import PreloadPlugin from '@jspsych/plugin-preload';
import { DataCollection, JsPsych, initJsPsych } from 'jspsych';

import { AllSettingsType } from '../context/SettingsContext';
import { ExperimentState } from './jspsych/experiment-state-class';
import { finishExperiment } from './jspsych/finish';
import './jspsych/i18n';
import { buildCalibration, buildFinalCalibration } from './parts/calibration';
import { buildIntroduction } from './parts/introduction';
import { buildPracticeTrials } from './parts/practice';
import { buildTaskCore } from './parts/task-core';
import { buildValidation } from './parts/validation';
import './styles/main.scss';
import { PROGRESS_BAR } from './utils/constants';
import { Timeline } from './utils/types';

/**
 * @function run
 * @description Main function to run the experiment
 * @param {Object} config - Configuration object for the experiment
 */
export async function run({
  assetPaths,
  input,
  updateData,
}: {
  assetPaths: { images: string[]; audio: string[]; video: string[] };
  input: AllSettingsType;
  updateData: (data: DataCollection, settings: AllSettingsType) => void;
}): Promise<JsPsych> {
  // To do: Initiate a state based on 'input' containing all settings
  const state = new ExperimentState(input);

  const updateDataWithSettings = (data: DataCollection): void => {
    updateData(data, input);
  };

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: false,
    message_progress_bar: PROGRESS_BAR.PROGRESS_BAR_INTRODUCTION,
    display_element: 'jspsych-content',
    /* on_finish: (): void => {
      // const resultData = jsPsych.data.get();
      // onFinish(resultData);
    }, */
  });

  // Ensures warning message on reload
  window.addEventListener('beforeunload', (event) => {
    event.preventDefault();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = ''; // Modern browsers require returnValue to be set
    return '';
  });

  // Update everything below to just structurally import individual parts of the experiment
  const timeline: Timeline = [];
  timeline.push({
    type: PreloadPlugin,
    assetPaths,
    max_load_time: 120000, // Allows program to load (arbitrary value currently)
  });

  timeline.push(buildIntroduction(jsPsych));
  timeline.push(buildPracticeTrials(jsPsych, state));
  timeline.push(buildCalibration(jsPsych, state, updateDataWithSettings));
  timeline.push(buildValidation(jsPsych, state, updateDataWithSettings));
  timeline.push(buildTaskCore(jsPsych, state, updateDataWithSettings));
  timeline.push(buildFinalCalibration(jsPsych, state, updateDataWithSettings));

  // User clicks continue to download experiment data locally
  timeline.push(finishExperiment(jsPsych, updateDataWithSettings));
  await jsPsych.run(timeline);

  return jsPsych;
}
