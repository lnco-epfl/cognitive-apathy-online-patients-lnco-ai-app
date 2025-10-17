import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import { DataCollection, JsPsych } from 'jspsych';

import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  agencyTappingInstructionPagesStimulus,
  agencyTaskCoreBlockInstructionsStimuli,
  renderConnectionWarning,
} from '../jspsych/stimulus';
import { agencyTappingTrial } from '../trials/agency-tapping-task-trial';
import { countdownStep } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import { successScreen } from '../trials/success-trial';
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
  TRYING_AGAIN_LABEL,
  TRY_AGAIN_BUTTON,
} from '../utils/constants';
import { type Timeline, Trial } from '../utils/types';
import { checkKeys, checkLastAgencyTrialSuccess } from '../utils/utils';

/**
 * Display the preamble before the agency tapping trial
 * @param keySettings
 * @returns the trial that shows the instruction for the agency tapping task
 */
export const agencyTappingSectionDirectionTrial = (
  state: ExperimentState,
): Timeline =>
  agencyTappingInstructionPagesStimulus(state).map((_, index) => ({
    type: HtmlButtonResponsePlugin,
    stimulus() {
      return agencyTappingInstructionPagesStimulus(state)[index];
    },
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
      () => ({
        timeline: [
          {
            timeline: [
              countdownStep(state),
              agencyTappingTrial(jsPsych, state, device, 0, false, true),
              {
                timeline: [releaseKeysStep(state)],
                conditional_function() {
                  return checkKeys(jsPsych);
                },
              },
              successScreen(jsPsych),
              {
                timeline: [questionnaireTrial(0)],
                conditional_function() {
                  return checkLastAgencyTrialSuccess(jsPsych);
                },
              },
              loadingBarTrial(true, jsPsych),
            ],
            loop_function() {
              return !checkLastAgencyTrialSuccess(jsPsych);
            },
          },
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
  updateData: (data: DataCollection) => void,
): Trial => ({
  timeline: [
    {
      timeline: [
        countdownStep(state),
        agencyTappingTrial(jsPsych, state, device, delayLevel, false, false),
        {
          timeline: [releaseKeysStep(state)],
          conditional_function() {
            return checkKeys(jsPsych);
          },
        },
        successScreen(jsPsych),
        {
          timeline: [questionnaireTrial(delayLevel)],
          conditional_function() {
            return checkLastAgencyTrialSuccess(jsPsych);
          },
        },
        loadingBarTrial(true, jsPsych),
      ],
      loop_function() {
        return !checkLastAgencyTrialSuccess(jsPsych);
      },
    },
  ],
  on_timeline_finish() {
    updateData(jsPsych.data.get());
  },
});

export const agencyTappingBreakTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  updateData: (data: DataCollection) => void,
  breakNumber: number,
): Trial => {
  const breakDuration = state.getAgencyTaskSettings().breakDuration || 30000; // default 30s
  const allowSkip = breakNumber % 2 === 1; // Allow skip on every second break

  let remaining = breakDuration / 1000;

  const renderStimulus = (): string => `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <h2>${BREAK_TIME()}</h2>
      <p>${BREAK_MESSAGE(remaining.toFixed(0))}</p>
      ${allowSkip ? `<p>${SKIP_MESSAGE()}</p>` : ''}
      ${renderConnectionWarning(state)}
    </div>
  `;

  return {
    type: HtmlButtonResponsePlugin,
    stimulus: `<div id='break-stimulus-content'>${renderStimulus()}</div>`,
    choices: allowSkip ? [SKIP_BUTTON()] : [],
    trial_duration: breakDuration,
    on_start() {
      const interval = setInterval(() => {
        remaining -= 1;
        const container = document.querySelector('#break-stimulus-content');
        if (container) container.innerHTML = renderStimulus();
        if (remaining <= 0) clearInterval(interval);
      }, 1000);

      document.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (target.id === 'try-again-btn') {
          target.innerText = TRYING_AGAIN_LABEL();
          target.disabled = true;
          updateData(jsPsych.data.get());
          setTimeout(() => {
            if (state.getPatchStatus() === 'failed') {
              target.disabled = false;
              target.innerText = TRY_AGAIN_BUTTON();
            }
          }, 5000);
        }
      });
    },
    on_finish() {
      // clear interval if still running
      remaining = 0;
    },
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
  updateData: (data: DataCollection) => void,
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
      timeline.push(
        agencyTappingBreakTrial(
          jsPsych,
          state,
          updateData,
          Math.floor(idx / breakFrequency),
        ),
      );
    }
    timeline.push(
      agencyCoreBlockTappingTask(
        jsPsych,
        state,
        device,
        delayLevel,
        updateData,
      ),
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

  agencyTaskTimeline.push(...agencyTappingSectionDirectionTrial(state));

  agencyTaskTimeline.push(
    createAgencyTappingPracticeTrials(jsPsych, state, device),
  );

  agencyTaskTimeline.push(agencyTappingTaskCoreBlockInstructions(state));

  agencyTaskTimeline.push(
    ...buildCoreAgencyTappingTask(jsPsych, state, device, updateData),
  );

  agencyTaskTimeline.push(endOfAgencyTaskBreak());

  return agencyTaskTimeline;
};
