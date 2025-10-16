/**
 * @title Cognitive Apathy Experiment
 * @description This experiment aims to measure cognitive apathy using calibration and thermometer tasks.
 * @version 0.1.0
 *
 * @assets assets/
 */
import FullscreenPlugin from '@jspsych/plugin-fullscreen';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import PreloadPlugin from '@jspsych/plugin-preload';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Marked } from '@ts-stack/markdown';
import { DataCollection, JsPsych, initJsPsych } from 'jspsych';

import { ExperimentResult } from '../config/appResults';
import { AllSettingsType, NextStepSettings } from '../context/SettingsContext';
import { ExperimentState } from './jspsych/experiment-state-class';
import i18n from './jspsych/i18n';
import { continueMessageDirectionContent } from './jspsych/stimulus';
import { buildAgencyTaskCore } from './parts/agency-task-core';
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
import { CONTINUE_BUTTON_MESSAGE, PROGRESS_BAR } from './utils/constants';
import { addInstructionsButton, ensureModal } from './utils/instruction-modal';
import { ReloadObject, Timeline, Trial } from './utils/types';
import {
  changeProgressBar,
  getProgressBarStatus,
  resolveLink,
} from './utils/utils';

/**
 * Simple trial with continue message after returning to uncompleted experiment
 * @param jsPsych Experiment
 * @returns The Trial Object
 */
const continueMessageDirection = (state: ExperimentState): Trial => ({
  type: FullscreenPlugin,
  button_label: CONTINUE_BUTTON_MESSAGE(),
  message: continueMessageDirectionContent(),
  on_start() {
    addInstructionsButton(state);
    state.setInstructionPhase('validation');
  },
});

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
 * function to add a full screen button
 */
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

/**
 * function to add a font size menu
 */
const addFontSizeMenu = (state: ExperimentState): void => {
  // Add dropdown when the trial starts
  const progressBar = document.getElementById('jspsych-progressbar-container');
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
    fontSizeTitle.style.marginLeft = '10px';
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
    });
  }
};

/**
 * @function run
 * @description Main function to run the experiment
 * @param {Object} config - Configuration object for the experiment
 */
export async function run({
  assetPaths,
  input,
  updateDataPromise,
}: {
  assetPaths: { images: string[]; audio: string[]; video: string[] };
  input: {
    settings: AllSettingsType;
    results: ExperimentResult;
    participantName: string;
    reloadObject?: ReloadObject;
  };
  updateDataPromise: (
    data: DataCollection,
    settings: AllSettingsType,
  ) => Promise<boolean>;
}): Promise<JsPsych> {
  // --------------------------------------
  // Define Variables
  // --------------------------------------
  // Create an Experiment State Object using the Settings
  const state = new ExperimentState(input.settings);

  // If this experiment is a restart of an incomplete participant, update medianTaps values
  if (input.reloadObject) {
    if (input.reloadObject.medianTaps) {
      state.setMedianTaps(input.reloadObject.medianTaps);
    }
    if (input.reloadObject.preferredHand) {
      state.setPreferredHand(input.reloadObject.preferredHand);
    }
    if (input.reloadObject.totalReward) {
      state.setPreviousReward(input.reloadObject.totalReward);
    }
  }

  // Create Device Object in case of Triggers
  const device: DeviceType = {
    device: null,
    sendTriggerFunction: async (
      _device: SerialPort | null,
      _trigger: number,
    ) => {},
  };

  // Create update function incorporating settings
  const updateDataWithSettings = async (
    data: DataCollection,
  ): Promise<void> => {
    const result = await updateDataPromise(data, input.settings);
    if (result) {
      state.setLastPatchSuccessful(true);
      console.warn('Successfully updated data');
    } else {
      state.setLastPatchSuccessful(false);
      console.warn('Failed to update data');
    }
  };

  // --------------------------------------
  // Apply settings
  // --------------------------------------
  // Change language of i18n to match language in the settings
  i18n.changeLanguage(input.settings.languageSettings.language);

  // Apply photodiode settings (on/off and location)
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

  // Apply fontSize settings
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

  // --------------------------------------
  // Setup jsPsych + Timeline
  // --------------------------------------
  const jsPsych = initJsPsych({
    show_progress_bar: true,
    auto_update_progress_bar: false,
    message_progress_bar: PROGRESS_BAR().PROGRESS_BAR_INTRODUCTION,
    display_element: 'jspsych-display-element',
    on_finish: (): void => {
      const resultData = jsPsych.data.get();
      updateDataWithSettings(resultData);
    },
  });

  // Create and add a "BlockUnload" to prevent accidental tab closures
  const blockUnload = (event: BeforeUnloadEvent): string => {
    event.preventDefault();
    // eslint-disable-next-line no-param-reassign
    event.returnValue = '';
    updateDataWithSettings(jsPsych.data.get());
    return '';
  };
  // Add EventListener to unload
  window.addEventListener('beforeunload', blockUnload);

  // Update everything below to just structurally import individual parts of the experiment
  const timeline: Timeline = [];

  // Add the preloader to render images and videos
  timeline.push({
    type: PreloadPlugin,
    assetPaths,
    max_load_time: 120000, // Allows program to load (arbitrary value currently)
    on_load() {
      addFullscreenButton();
      addFontSizeMenu(state);
      ensureModal();
    },
  });

  // If the experiment involves the use of a device (for sending triggers), then show "DeviceConnectPages" to initiate connection
  if (state.getGeneralSettings().useDevice) {
    timeline.push(deviceConnectPages(jsPsych, device, false));
  }

  // If the experiment does not involve a continuation of a previously started participant, then display starting introduction
  if (!input.reloadObject) {
    // Add introduction block to the timeline
    timeline.push(buildIntroduction(state));
    // Add practice block to the timeline
    timeline.push({
      timeline: [...buildPracticeTrials(jsPsych, state, device)],
      on_timeline_start() {
        state.setInstructionPhase('practice');
        addInstructionsButton(state);
        changeProgressBar(
          PROGRESS_BAR().PROGRESS_BAR_PRACTICE,
          getProgressBarStatus(state),
          jsPsych,
        );
        // Update last trial in data to include checkpoint that practice has been started
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.checkpoint = state.getState().phase;
        }
      },
    });
    // Add calibration block to the timeline
    timeline.push({
      timeline: [
        ...buildCalibration(jsPsych, state, updateDataWithSettings, device),
      ],
      on_timeline_start() {
        state.setInstructionPhase('calibration');
        changeProgressBar(
          PROGRESS_BAR().PROGRESS_BAR_CALIBRATION,
          getProgressBarStatus(state),
          jsPsych,
        );
        // Update last trial in data to include checkpoint that calibration has been started
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.checkpoint = state.getState().phase;
        }
      },
    });

    // Add validation block to the timeline
    timeline.push({
      timeline: [
        ...buildValidation(jsPsych, state, updateDataWithSettings, device),
      ],
      on_timeline_start() {
        state.setInstructionPhase('validation');
        changeProgressBar(
          PROGRESS_BAR().PROGRESS_BAR_VALIDATION,
          getProgressBarStatus(state),
          jsPsych,
        );
        // Update last trial in data to include checkpoint that validation has been started
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.checkpoint = state.getState().phase;
        }
      },
    });
  } else {
    // If this is a continuation of a previous participant, then display a short message to inform the user that the experiment will continue from where they left off
    timeline.push(continueMessageDirection(state));
  }
  if (!input.reloadObject || input.reloadObject?.phase === 'EBDM') {
    // For all instances (restart or not) build (remaining) task blocks
    timeline.push({
      timeline: [
        ...buildTaskCore(
          jsPsych,
          state,
          updateDataWithSettings,
          device,
          input.reloadObject?.remainingTrialBlocks,
        ),
      ],
      on_timeline_start() {
        // Determine the index of the first trial block to configure progressbar (also in case of non-zero on restart)
        let trialBlockStart = 0;
        if (input.reloadObject?.remainingTrialBlocks) {
          trialBlockStart =
            input.settings.taskSettings.taskBlockRepetitions *
              input.settings.taskSettings.taskBlocksIncluded.length -
            input.reloadObject.remainingTrialBlocks.length;
        }
        state.setInstructionPhase('EBDM');
        changeProgressBar(
          PROGRESS_BAR().PROGRESS_BAR_TRIAL_BLOCKS,
          getProgressBarStatus(state, trialBlockStart),
          jsPsych,
        );
        // Update last trial in data to include checkpoint that EBDM Task has been started
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.checkpoint = state.getState().phase;
          lastTrial.checkpointBlock = trialBlockStart; // Add the block number too
        }
      },
    });
  }

  // Add Agency Task block to the timeline
  if (!input.reloadObject || input.reloadObject?.phase !== 'final-calibration')
    timeline.push({
      timeline: [
        ...buildAgencyTaskCore(jsPsych, state, updateDataWithSettings, device),
      ],
      on_timeline_start() {
        // Add checkpoint to the data for upon reloading the experiment
        state.setInstructionPhase('agency');
        changeProgressBar(
          PROGRESS_BAR().PROGRESS_BAR_AGENCY_BLOCKS,
          getProgressBarStatus(state),
          jsPsych,
        );
        // Update last trial in data to include checkpoint that Agency Task has been started
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.checkpoint = state.getState().phase;
        }
      },
    });

  // Add final calibration block to the timeline
  timeline.push({
    timeline: [
      ...buildFinalCalibration(jsPsych, state, updateDataWithSettings, device),
    ],
    on_timeline_start() {
      state.setInstructionPhase('final-calibration');
      // Update last trial in data to include checkpoint that Final Calibration has been started
      const lastTrial = jsPsych.data.get().last(1).values()[0];
      if (lastTrial) {
        lastTrial.checkpoint = state.getState().phase;
      }
    },
    on_timeline_finish() {
      changeProgressBar(
        PROGRESS_BAR().PROGRESS_BAR_FINAL_CALIBRATION,
        1,
        jsPsych,
      );
    },
  });

  // Add "next step page" to the timeline, in case this is configured
  if (state.getNextStepSettings().linkToNextPage) {
    const nextStepLink = resolveLink(
      state.getNextStepSettings().link,
      input.participantName,
    );
    timeline.push({
      ...getEndPage({ ...state.getNextStepSettings(), link: nextStepLink }),
      on_load() {
        // Remove warning for closing down the tab
        window.removeEventListener('beforeunload', blockUnload);
        updateDataWithSettings(jsPsych.data.get());
      },
    });
  }

  // Finally, run the timeline
  await jsPsych.run(timeline);

  return jsPsych;
}
