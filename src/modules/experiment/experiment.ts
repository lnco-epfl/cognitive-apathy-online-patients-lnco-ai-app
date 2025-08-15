/**
 * @title Cognitive Apathy Experiment
 * @description This experiment aims to measure cognitive apathy using calibration and thermometer tasks.
 * @version 0.1.0
 *
 * @assets assets/
 */
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import PreloadPlugin from '@jspsych/plugin-preload';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Marked } from '@ts-stack/markdown';
import { DataCollection, JsPsych, initJsPsych } from 'jspsych';

import { ExperimentResult } from '../config/appResults';
import { AllSettingsType, NextStepSettings } from '../context/SettingsContext';
import {
  ExperimentState,
  MedianTapsType,
} from './jspsych/experiment-state-class';
import './jspsych/i18n';
import { buildCalibration, buildFinalCalibration } from './parts/calibration';
import { buildIntroduction } from './parts/introduction';
import { buildPracticeTrials } from './parts/practice';
import { buildTaskCore } from './parts/task-core';
import { buildValidation } from './parts/validation';
import './styles/main.scss';
import {
  DeviceType,
  SerialPort,
  deviceConnectPages,
} from './triggers/serialport';
import { PROGRESS_BAR } from './utils/constants';
import { DelayType, Timeline, Trial } from './utils/types';
import { changeProgressBar, resolveLink } from './utils/utils';

/**
 *
 * @returns Returns a simple welcome screen that automatically triggers fullscreen when the start button is pressed
 */
const getEndPage = ({
  title,
  description,
  link,
  linkText,
}: NextStepSettings): Trial => ({
  type: jsPsychHtmlKeyboardResponse,
  choices: 'NO_KEYS',
  stimulus: `<div class='sd-html'><h3>${title}</h3><p>${Marked.parse(description)}</p><a class='link-to-experiment' target="_parent" href=${link}>${linkText}</a></div>`,
});

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
  input: {
    settings: AllSettingsType;
    results: ExperimentResult;
    participantName: string;
    remainingTrialBlocks?: DelayType[];
    medianTaps?: MedianTapsType;
  };
  updateData: (data: DataCollection, settings: AllSettingsType) => void;
}): Promise<JsPsych> {
  // To do: Initiate a state based on 'input' containing all settings
  const state = new ExperimentState(input.settings);

  // Pseudo state variable
  const device: DeviceType = {
    device: null,
    sendTriggerFunction: async (
      _device: SerialPort | null,
      _trigger: number,
    ) => {},
  };

  if (state.getPhotoDiodeSettings().usePhotoDiode !== 'off') {
    const photoDiodeElement = document.createElement('div');
    photoDiodeElement.id = 'photo-diode-element';
    photoDiodeElement.className = `photo-diode photo-diode-black ${state.getPhotoDiodeSettings().usePhotoDiode} ${state.getPhotoDiodeSettings().testPhotoDiode ? 'photo-diode-test' : ''}`;
    document
      .getElementById('jspsych-display-element')
      ?.appendChild(photoDiodeElement);
    if (state.getPhotoDiodeSettings().usePhotoDiode === 'customize') {
      const left = state.getPhotoDiodeSettings().photoDiodeLeft;
      const top = state.getPhotoDiodeSettings().photoDiodeTop;
      const width = state.getPhotoDiodeSettings().photoDiodeWidth;
      const height = state.getPhotoDiodeSettings().photoDiodeHeight;
      if (photoDiodeElement && left && top && width && height) {
        photoDiodeElement.style.setProperty('--photodiode-left', left);
        photoDiodeElement.style.setProperty('--photodiode-top', top);
        photoDiodeElement.style.setProperty('--photodiode-width', width);
        photoDiodeElement.style.setProperty('--photodiode-height', height);
      }
    }
  }

  if (state.getGeneralSettings().fontSize) {
    const jspsychDisplayElement = document.getElementById(
      'jspsych-display-element',
    );
    if (jspsychDisplayElement) {
      jspsychDisplayElement.setAttribute(
        'data-font-size',
        state.getGeneralSettings().fontSize,
      );
    }
  }

  if (state.getGeneralSettings().fontSize) {
    const jspsychDisplayElement = document.getElementById(
      'jspsych-display-element',
    );
    if (jspsychDisplayElement) {
      jspsychDisplayElement.setAttribute(
        'data-font-size',
        state.getGeneralSettings().fontSize,
      );
    }
  }

  const updateDataWithSettings = (data: DataCollection): void => {
    updateData(data, input.settings);
  };

  // Function to create the re-enter fullscreen button
  const addFullscreenButton = (): void => {
    // Select the progress bar container
    const progressBarContainer = document.getElementById(
      'jspsych-progressbar-container',
    );

    if (progressBarContainer) {
      // Create a button element
      const fullscreenButton = document.createElement('button');
      fullscreenButton.textContent = 'Fullscreen';
      fullscreenButton.className = 'jspsych-btn-progress-bar';
      fullscreenButton.style.marginLeft = '10px'; // Style it as needed
      fullscreenButton.style.cursor = 'pointer';

      // Add an event listener to the button
      fullscreenButton.addEventListener('click', () => {
        const docEl = document.documentElement as HTMLElement & {
          mozRequestFullScreen?: () => Promise<void>;
          webkitRequestFullscreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          // Firefox
          docEl.mozRequestFullScreen();
        } else if (docEl.webkitRequestFullscreen) {
          // Chrome, Safari, and Opera
          docEl.webkitRequestFullscreen();
        } else if (docEl.msRequestFullscreen) {
          // IE/Edge
          docEl.msRequestFullscreen();
        }
      });

      // Append the button to the progress bar container
      progressBarContainer.appendChild(fullscreenButton);
    }
  };

  const addFontSizeMenu = (): void => {
    // Add dropdown when the trial starts
    const progressBar = document.getElementById(
      'jspsych-progressbar-container',
    );
    if (progressBar && !document.querySelector('.custom-dropdown')) {
      // Create dropdown element
      const dropdown = document.createElement('select');
      dropdown.className = 'custom-dropdown';
      dropdown.innerHTML = `
          <option value="small" ${state.getGeneralSettings().fontSize === 'small' ? 'selected' : ''}>Small</option>
          <option value="normal" ${state.getGeneralSettings().fontSize === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="large" ${state.getGeneralSettings().fontSize === 'large' ? 'selected' : ''}>Large</option>
          <option value="extra-large" ${state.getGeneralSettings().fontSize === 'extra-large' ? 'selected' : ''}>Extra Large</option>
        `;
      const fontSizeTitle = document.createElement('span');
      fontSizeTitle.innerHTML = 'Font Size:';
      fontSizeTitle.style.marginLeft = '10px'; // Add some spacing
      progressBar.appendChild(fontSizeTitle);
      progressBar.appendChild(dropdown);

      // Handle dropdown change
      dropdown.addEventListener('change', (event) => {
        const { target } = event;
        const jspsychDisplayElement = document.getElementById(
          'jspsych-display-element',
        );
        if (jspsychDisplayElement && target instanceof HTMLSelectElement) {
          jspsychDisplayElement.setAttribute('data-font-size', target.value);
        }
        // Add custom logic for dropdown changes
      });
    }
  };

  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: false,
    message_progress_bar: PROGRESS_BAR.PROGRESS_BAR_INTRODUCTION,
    display_element: 'jspsych-display-element',
    /* on_finish: (): void => {
      // const resultData = jsPsych.data.get();
      // onFinish(resultData);
    }, */
  });

  const blockUnload = (event: BeforeUnloadEvent): string => {
    event.preventDefault();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = ''; // Modern browsers require returnValue to be set
    updateDataWithSettings(jsPsych.data.get());
    return '';
  };
  // Ensures warning message on reload
  window.addEventListener('beforeunload', blockUnload);

  // Update everything below to just structurally import individual parts of the experiment
  const timeline: Timeline = [];

  timeline.push({
    type: PreloadPlugin,
    assetPaths,
    max_load_time: 120000, // Allows program to load (arbitrary value currently)
    on_load() {
      addFullscreenButton();
      addFontSizeMenu();
    },
  });

  if (state.getGeneralSettings().useDevice) {
    timeline.push(deviceConnectPages(jsPsych, device, false));
  }

  if (input.medianTaps) {
    state.setMedianTaps(input.medianTaps);
  }

  if (!input.remainingTrialBlocks) {
    timeline.push(buildIntroduction());
    timeline.push({
      timeline: [...buildPracticeTrials(jsPsych, state, device)],
      on_timeline_finish() {
        changeProgressBar(
          PROGRESS_BAR.PROGRESS_BAR_CALIBRATION,
          state.getProgressBarStatus('practice'),
          jsPsych,
        );
      },
    });
    timeline.push({
      timeline: [
        ...buildCalibration(jsPsych, state, updateDataWithSettings, device),
      ],
      on_timeline_finish() {
        changeProgressBar(
          PROGRESS_BAR.PROGRESS_BAR_VALIDATION,
          state.getProgressBarStatus('calibration'),
          jsPsych,
        );
      },
    });
    timeline.push({
      timeline: [
        ...buildValidation(jsPsych, state, updateDataWithSettings, device),
      ],
      on_timeline_finish() {
        changeProgressBar(
          PROGRESS_BAR.PROGRESS_BAR_TRIAL_BLOCKS,
          state.getProgressBarStatus('block', 0),
          jsPsych,
        );
      },
    });
  }
  timeline.push({
    timeline: [
      ...buildTaskCore(
        jsPsych,
        state,
        updateDataWithSettings,
        device,
        input.remainingTrialBlocks,
      ),
    ],
    on_timeline_start() {
      let trialBlockStart = 0;
      if (input.remainingTrialBlocks) {
        trialBlockStart =
          input.settings.taskSettings.taskBlockRepetitions *
            input.settings.taskSettings.taskBlocksIncluded.length -
          input.remainingTrialBlocks.length;
      }
      changeProgressBar(
        PROGRESS_BAR.PROGRESS_BAR_TRIAL_BLOCKS,
        state.getProgressBarStatus('block', trialBlockStart),
        jsPsych,
      );
    },
    on_timeline_finish() {
      changeProgressBar(
        PROGRESS_BAR.PROGRESS_BAR_FINAL_CALIBRATION,
        state.getProgressBarStatus('finalCal'),
        jsPsych,
      );
    },
  });

  timeline.push({
    timeline: [
      ...buildFinalCalibration(jsPsych, state, updateDataWithSettings, device),
    ],
    on_timeline_finish() {
      changeProgressBar(
        PROGRESS_BAR.PROGRESS_BAR_FINAL_CALIBRATION,
        1,
        jsPsych,
      );
    },
  });

  // User clicks continue to download experiment data locally
  if (state.getNextStepSettings().linkToNextPage) {
    const nextStepLink = resolveLink(
      state.getNextStepSettings().link,
      input.participantName,
    );
    timeline.push({
      ...getEndPage({ ...state.getNextStepSettings(), link: nextStepLink }),
      on_load() {
        window.removeEventListener('beforeunload', blockUnload);
        updateDataWithSettings(jsPsych.data.get());
      },
    });
  }
  await jsPsych.run(timeline);

  return jsPsych;
}
