import { JsPsych } from 'jspsych';

import { Trial } from '../utils/types';
import {
  CANDIDATE_DELAYS,
  SEED_DELAYS,
  computeEIG,
  posteriorFromData,
  selectNextDelay,
} from './adoMath';

type AgencyTrial = {
  delay: number;
  response: string;
  responseNumeric: number;
};

function getAgencyData(jsPsych: JsPsych): AgencyTrial[] {
  const allData = jsPsych.data.get().values();

  return allData
    .filter(
      (d: Trial) =>
        d.trial_type === 'html-keyboard-response' &&
        typeof d.delayLevel !== 'undefined' &&
        typeof d.mapped_response !== 'undefined' &&
        typeof d.practice !== 'undefined' &&
        d.practice === false,
    )
    .map(
      (d: Trial): AgencyTrial => ({
        delay: Number(d.delayLevel),
        response: d.mapped_response as string,
        responseNumeric:
          (d.mapped_response as string).toLowerCase() === 'yes' ? 1 : 0,
      }),
    );
}

export const getNextDelayLevel = (jsPsych: JsPsych): number => {
  let nextDelayLevel = 0;
  const agencyData = getAgencyData(jsPsych);

  if (agencyData.length < SEED_DELAYS.length) {
    nextDelayLevel = SEED_DELAYS[agencyData.length];
  } else {
    const delays = agencyData.map((d) => d.delay);
    const responses = agencyData.map((d) => d.responseNumeric);

    const posterior = posteriorFromData(delays, responses);
    const eigs = computeEIG(CANDIDATE_DELAYS, posterior);

    const historyCounts = delays.reduce<Record<number, number>>((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    nextDelayLevel = selectNextDelay(CANDIDATE_DELAYS, eigs, historyCounts);
  }
  return nextDelayLevel;
};
