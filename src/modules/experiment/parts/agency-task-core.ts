import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import { DataCollection, JsPsych } from 'jspsych';

import { KeySettings } from '@/modules/context/SettingsContext';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  agencyTappingInstructionPagesStimulus,
  agencyTaskCoreBlockInstructionsStimuli,
} from '../jspsych/stimulus';
import { agencyTappingTrial } from '../trials/agency-tapping-task-trial';
import { countdownStep } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import {
  successScreen,
  successScreenFreezeFrame,
} from '../trials/success-trial';
import { DeviceType } from '../triggers/serialport';
import {
  AGENCY_TASK_COMPLETION_MESSAGE,
  AGENCY_TASK_COMPLETION_TITLE,
  AGENCY_TASK_CONTROL_QUESTION,
  ANSWER_OPTIONS_INSTRUCTION,
  BREAK_MESSAGE,
  BREAK_TIME,
  CONTINUE_BUTTON_MESSAGE,
  SKIP_BUTTON,
  SKIP_MESSAGE,
  TASK_COMPLETION_BREAK_DURATION,
  TASK_COMPLETION_BREAK_MESSAGE,
} from '../utils/constants';
import { type Timeline, Trial } from '../utils/types';
import { checkKeys, checkLastAgencyTrialSuccess } from '../utils/utils';

/**
 * Display the preamble before the agency tapping trial
 * @param keySettings
 * @returns the trial that shows the instruction for the agency tapping task
 */
export const agencyTappingSectionDirectionTrial = (
  keySettings: KeySettings,
): Timeline =>
  agencyTappingInstructionPagesStimulus(keySettings).map((page) => ({
    type: HtmlButtonResponsePlugin,
    stimulus: [page],
    choices: [CONTINUE_BUTTON_MESSAGE()],
  }));

/**
 * Single trial with the "feeling in control (Y/N)" questionnaire
 */
const questionnaireTrial = (delayLevel: number = -1): Trial => ({
  type: HtmlKeyboardResponsePlugin,
  stimulus: `
    <div style="text-align: center; margin: auto; font-size: 1.5em;">
      <b>${AGENCY_TASK_CONTROL_QUESTION()}</b>
    </div>
  `,
  choices: ['y', 'n'],
  prompt: `
    <br>
    <p style="text-align: center; font-size: 1.2em;">
      ${ANSWER_OPTIONS_INSTRUCTION()}
    </p>
  `,
  response_ends_trial: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on_finish: (data: any) => {
    if (data.response === 'y') {
      // eslint-disable-next-line no-param-reassign
      data.mapped_response = 'yes';
    } else if (data.response === 'n') {
      // eslint-disable-next-line no-param-reassign
      data.mapped_response = 'no';
    }
    // eslint-disable-next-line no-param-reassign
    data.delayLevel = delayLevel; // Store the delay level in the trial data
  },
});

/**
 * Next step are three practice trials with the Agency Tapping Trial, the first with Freeze Frames
 * @param ExperimentState
 * @returns the trial that shows the instruction for the agency tapping task
 */
export const createAgencyTappingPracticeTrials = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
): Trial => ({
  timeline: [
    ...Array.from(
      { length: state.getAgencyTaskSettings().numberOfPracticeTrials },
      (_, index) => ({
        timeline: [
          {
            timeline: [
              countdownStep(state),
              agencyTappingTrial(jsPsych, state, device, 0, index === 0),
              {
                timeline: [releaseKeysStep(state)],
                conditional_function() {
                  return checkKeys(jsPsych);
                },
              },
              successScreenFreezeFrame(jsPsych, false, state.getKeySettings()),
              loadingBarTrial(true, jsPsych),
            ],
            loop_function() {
              return !checkLastAgencyTrialSuccess(jsPsych);
            },
          },
          questionnaireTrial(0),
        ],
      }),
    ),
  ],
});

/**
 * Instructions for core trial block Agency Tapping Task
 * @returns the trial that shows the instructions for the core agency task blocks
 */
export const agencyTappingTaskCoreBlockInstructions = (
  state: ExperimentState,
): Trial => ({
  type: HtmlButtonResponsePlugin,
  choices: [CONTINUE_BUTTON_MESSAGE()],
  stimulus: [
    agencyTaskCoreBlockInstructionsStimuli(
      state.getAgencyTaskSettings().breakFrequency,
    ),
  ],
});

/**
 * Generate a single trial for the tapping task core trial block with a specific delayLevel
 * @returns timeline with a single tapping task trial
 */
export const agencyCoreBlockTappingTask = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
  delayLevel: number,
): Trial => ({
  timeline: [
    {
      timeline: [
        countdownStep(state),
        agencyTappingTrial(jsPsych, state, device, delayLevel, false),
        {
          timeline: [releaseKeysStep(state)],
          conditional_function() {
            return checkKeys(jsPsych);
          },
        },
        successScreen(jsPsych),
        loadingBarTrial(true, jsPsych),
      ],
      loop_function() {
        return !checkLastAgencyTrialSuccess(jsPsych);
      },
    },
    questionnaireTrial(delayLevel),
  ],
});

export const agencyTappingBreakTrial = (state: ExperimentState): Trial => {
  const breakDuration = state.getAgencyTaskSettings().breakDuration || 30000; // default 30s
  const allowSkip = state.getAgencyTaskSettings().allowBreakSkip ?? true;

  return {
    type: HtmlButtonResponsePlugin,
    stimulus: [
      `<div>
        <h2>${BREAK_TIME()}</h2>
        <p>${BREAK_MESSAGE((breakDuration / 1000).toFixed(0))}</p>
        ${allowSkip ? `<p>${SKIP_MESSAGE()}</p>` : ''}
      </div>`,
    ],
    choices: allowSkip ? [SKIP_BUTTON()] : [],
    trial_duration: breakDuration,
  };
};

/**
 * Build the core component of the Agency Tapping Task, including shuffling trials and adding breaks
 * @returns the complete timeline with the core of the agency tapping task
 */
export const buildCoreAgencyTappingTask = (
  jsPsych: JsPsych,
  state: ExperimentState,
  device: DeviceType,
): Timeline => {
  const {
    breakFrequency,
    maxDelay,
    numberOfDelayConditions,
    conditionRepetitions,
  } = state.getAgencyTaskSettings();
  // Calculate evenly distributed delay levels
  const delayLevels = Array.from({ length: numberOfDelayConditions }, (_, i) =>
    Math.round((maxDelay * i) / (numberOfDelayConditions - 1)),
  );

  // Create trial sequencing: each delay repeated conditionRepetitions times, then shuffled
  const trialSequencing = Array.from({ length: conditionRepetitions }, () => [
    ...delayLevels,
  ]).flat();

  // Shuffle the trial sequencing array
  for (let i = trialSequencing.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [trialSequencing[i], trialSequencing[j]] = [
      trialSequencing[j],
      trialSequencing[i],
    ];
  }
  // Build the main timeline with breaks
  const timeline: Timeline = [];
  trialSequencing.forEach((delayLevel, idx) => {
    // Insert break trial every breakFrequency trials (except at the start)
    if (idx > 0 && idx % breakFrequency === 0) {
      timeline.push(agencyTappingBreakTrial(state));
    }
    timeline.push(
      agencyCoreBlockTappingTask(jsPsych, state, device, delayLevel),
    );
  });

  return timeline;
};

export const endOfAgencyTaskBreak = (): Trial => ({
  type: HtmlButtonResponsePlugin,
  stimulus: [
    `
      <h2>${AGENCY_TASK_COMPLETION_TITLE()}</h2>
      <p>${AGENCY_TASK_COMPLETION_MESSAGE()}</p><br>
      <p >${TASK_COMPLETION_BREAK_MESSAGE(
        (TASK_COMPLETION_BREAK_DURATION / 1000).toFixed(0),
      )}</p>
    `,
  ],
  choices: [SKIP_BUTTON()],
  trial_duration: TASK_COMPLETION_BREAK_DURATION,
  on_load() {
    // Timer logic
    let remaining = TASK_COMPLETION_BREAK_DURATION / 1000;
    const timerElem = document.getElementById('break-timer');
    const interval = setInterval(() => {
      remaining -= 1;
      if (timerElem) {
        timerElem.innerHTML = remaining.toFixed(0);
      }
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  },
  on_finish() {},
});
// export const endOfAgencyTaskBreak = (): Trial => ({
//   type: HtmlButtonResponsePlugin,
//   stimulus: [
//     `<div>
//         <h2>${AGENCY_TASK_COMPLETION_TITLE()}</h2>
//         <p>${AGENCY_TASK_COMPLETION_MESSAGE()}</p><br>
//         <p>${TASK_COMPLETION_BREAK_MESSAGE((TASK_COMPLETION_BREAK_DURATION / 1000).toFixed(0))}</p>
//       </div>`,
//   ],
//   choices: [SKIP_BUTTON()],
//   trial_duration: TASK_COMPLETION_BREAK_DURATION,
// });

/**
 * Combine all agency tapping trial to build the core of the agency tapping task
 * @returns
 */
export const buildAgencyTaskCore = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Timeline => {
  const agencyTaskTimeline: Timeline = [];

  agencyTaskTimeline.push(
    ...agencyTappingSectionDirectionTrial(state.getKeySettings()),
  );

  agencyTaskTimeline.push(
    createAgencyTappingPracticeTrials(jsPsych, state, device),
  );

  agencyTaskTimeline.push(agencyTappingTaskCoreBlockInstructions(state));

  agencyTaskTimeline.push(
    ...buildCoreAgencyTappingTask(jsPsych, state, device),
  );

  agencyTaskTimeline.push(endOfAgencyTaskBreak());

  return agencyTaskTimeline;
};
