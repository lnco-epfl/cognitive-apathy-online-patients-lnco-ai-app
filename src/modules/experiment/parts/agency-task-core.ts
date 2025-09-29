import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import { DataCollection, JsPsych } from 'jspsych';

import { KeySettings } from '@/modules/context/SettingsContext';

import { ExperimentState } from '../jspsych/experiment-state-class';
import { agencyTappingInstructionPagesStimulus } from '../jspsych/stimulus';
import { DeviceType } from '../triggers/serialport';
import { CONTINUE_BUTTON_MESSAGE } from '../utils/constants';
import { type Timeline, type Trial } from '../utils/types';

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

  return agencyTaskTimeline;
};
