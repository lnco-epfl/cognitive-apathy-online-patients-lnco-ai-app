import surveyLikert from '@jspsych/plugin-survey-likert';
import { JsPsych } from 'jspsych';
import { AudioNarration } from 'jspsych-audio-narration';

import {
  CONTINUE_BUTTON_MESSAGE,
  LIKERT_PREAMBLE_BLOCK,
  LIKERT_PREAMBLE_DEMO,
  LIKERT_PREAMBLE_FINAL_QUESTIONS,
  LIKERT_RESPONSES,
  LIKERT_RESPONSES_ATTENTION,
  LIKERT_RESPONSES_FATIGUE,
  LIKERT_RESPONSES_FRUSTRATION,
  LIKERT_RESPONSES_MOTIVATION,
  LIKERT_RESPONSES_TIREDNESS,
  LIKERT_SURVEY_1_QUESTIONS,
  LIKERT_SURVEY_2_QUESTIONS,
  LIKERT_SURVEY_3_QUESTIONS,
} from '../utils/constants';
import { Timeline } from '../utils/types';

const finalQuestionPrompt = (
  question: string,
  includePreamble: boolean,
): string =>
  includePreamble
    ? `<p style="text-align: left;">${LIKERT_PREAMBLE_FINAL_QUESTIONS()}</p><br><br><b>${question}</b>`
    : `<b>${question}</b>`;

/**
 * @const likertQuestions1
 * @description A jsPsych trial object representing the likert scale question asked after a set of demo trials.
 *
 * This trial includes:
 * - A single Likert scale question with 7 response options ranging from "Strongly Disagree" to "Strongly Agree".
 * - This trial object contains the first 6 Likert questions that will be in a random order:
 * - "QUESTION_1": "I felt I was in control of the bar's movement."
 * - The participant must respond to the question to proceed (required: true).
 * - A custom button label is used for submitting the response.
 *
 * This is used to collect participant responses on a specific question in the Likert survey after the 3 demo trials.
 */
export const likertQuestions1 = (narration: AudioNarration): Timeline => [
  {
    type: surveyLikert,
    preamble: `${LIKERT_PREAMBLE_DEMO()}`,
    questions: [
      {
        prompt: `<b>${LIKERT_SURVEY_1_QUESTIONS().QUESTION_1}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_1_QUESTIONS().QUESTION_1,
        required: true,
      },
      {
        prompt: `<b>${LIKERT_SURVEY_1_QUESTIONS().QUESTION_2}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_1_QUESTIONS().QUESTION_2,
        required: true,
      },
    ],
    randomize_question_order: true,
    button_label: CONTINUE_BUTTON_MESSAGE(),
    on_load() {
      narration.play(`assets/audio/likert-demo-preamble.mp3`);
    },
    on_finish() {
      narration.stop();
    },
  },
];
/**
 * @const likertQuestions2
 * @description An array of jsPsych trial objects representing the first 6 questions asked after a trial block (in a random order).
 *
 * This array includes:
 * - Six separate Likert scale questions, each with 7 response options ranging from "Strongly Disagree" to "Strongly Agree".
 * - This trial object contains the following 6 Likert questions:
 * - "QUESTION_1": "My task performance affects how I feel now.",
 * - "QUESTION_2": "I felt bad when I did not perform the task successfully.",
 * - "QUESTION_3": "It was difficult to work out what I had to do to complete the task successfully.",
 * - "QUESTION_4": "It was difficult to keep my mind on the task.",
 * - "QUESTION_5": "I set myself the goal to perform the task better.",
 * - "QUESTION_6": "I felt that I needed a push to continue tapping until the end of the task.",
 * - The participant must respond to each question to proceed (required: true).
 * - A custom button label is used for each question's submission.
 *
 * This is used to collect participant responses on a set of questions in the second Likert survey after a block of trials.
 */
export const likertQuestions2 = (narration: AudioNarration): Timeline => [
  {
    type: surveyLikert,
    preamble: `${LIKERT_PREAMBLE_BLOCK()}`,
    questions: [
      {
        prompt: `<b>${LIKERT_SURVEY_2_QUESTIONS().QUESTION_1}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_2_QUESTIONS().QUESTION_1,
        required: true,
      },
      {
        prompt: `<b>${LIKERT_SURVEY_2_QUESTIONS().QUESTION_2}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_2_QUESTIONS().QUESTION_2,
        required: true,
      },
      {
        prompt: `<b>${LIKERT_SURVEY_2_QUESTIONS().QUESTION_3}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_2_QUESTIONS().QUESTION_3,
        required: true,
      },
      {
        prompt: `<b>${LIKERT_SURVEY_2_QUESTIONS().QUESTION_4}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_2_QUESTIONS().QUESTION_4,
        required: true,
      },
      {
        prompt: `<b>${LIKERT_SURVEY_2_QUESTIONS().QUESTION_5}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_2_QUESTIONS().QUESTION_5,
        required: true,
      },
      {
        prompt: `<b>${LIKERT_SURVEY_2_QUESTIONS().QUESTION_6}</b>`,
        labels: [
          LIKERT_RESPONSES().STRONGLY_DISAGREE,
          LIKERT_RESPONSES().DISAGREE,
          LIKERT_RESPONSES().SOMEWHAT_DISAGREE,
          LIKERT_RESPONSES().NEUTRAL,
          LIKERT_RESPONSES().SOMEWHAT_AGREE,
          LIKERT_RESPONSES().AGREE,
          LIKERT_RESPONSES().STRONGLY_AGREE,
        ],
        name: LIKERT_SURVEY_2_QUESTIONS().QUESTION_6,
        required: true,
      },
    ],
    randomize_question_order: true,
    button_label: CONTINUE_BUTTON_MESSAGE(),
    on_load() {
      narration.play(`assets/audio/likert-state-preamble.mp3`);
    },
    on_finish() {
      narration.stop();
    },
  },
];

/**
 * @const likertFinalQuestion
 * @description An array of jsPsych trial objects representing the final 2 likert questions asked in non-random order after a trial block.
 *
 * This array includes:
 * - Two separate Likert scale questions, each with 7 response options ranging from "Strongly Disagree" to "Strongly Agree".
 * - This trial object contains the following 2 Likert questions:
 * - "QUESTION_7": "I feel motivated to continue the task.",
 * - "QUESTION_8": "My left arm feels tired."
 * - The participant must respond to each question to proceed (required: true).
 * - A custom button label is used for each question's submission.
 *
 * This is used to collect participant responses on the final set of questions in the Likert survey after the first 6 randomized-order questions are completed after a block of trials.
 */
export const likertFinalQuestion = (narration: AudioNarration): Timeline => [
  {
    type: surveyLikert,
    preamble: `${LIKERT_PREAMBLE_FINAL_QUESTIONS()}`,
    questions: [
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_1,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_ATTENTION().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_ATTENTION().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_1,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_2,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_MOTIVATION().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_MOTIVATION().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_2,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_3,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_FATIGUE().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_FATIGUE().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_3,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_4,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_TIREDNESS().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_TIREDNESS().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_4,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_5,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_FRUSTRATION().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_FRUSTRATION().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_5,
        required: true,
      },
    ],
    data: {
      additional: true,
      validation: true,
    },
    randomize_question_order: false,
    button_label: CONTINUE_BUTTON_MESSAGE(),
    on_load() {
      narration.play(`assets/audio/likert-amf-preamble.mp3`);
    },
    on_finish() {
      narration.stop();
    },
  },
];

export const likertFinalQuestionAfterValidation = (
  narration: AudioNarration,
): Timeline => [
  {
    type: surveyLikert,
    preamble: `${LIKERT_PREAMBLE_FINAL_QUESTIONS()}`,
    questions: [
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_1,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_ATTENTION().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_ATTENTION().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_1,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_2,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_MOTIVATION().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_MOTIVATION().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_2,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_3,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_FATIGUE().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_FATIGUE().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_3,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_4,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_TIREDNESS().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_TIREDNESS().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_4,
        required: true,
      },
      {
        prompt: finalQuestionPrompt(
          LIKERT_SURVEY_3_QUESTIONS().QUESTION_5,
          false,
        ),
        labels: [
          `1 <br />${LIKERT_RESPONSES_FRUSTRATION().LOW}`,
          '2',
          '3',
          '4',
          '5',
          '6',
          `7 <br />${LIKERT_RESPONSES_FRUSTRATION().HIGH}`,
        ],
        name: LIKERT_SURVEY_3_QUESTIONS().QUESTION_5,
        required: true,
      },
    ],
    data: {
      additional: true,
      validation: true,
    },
    randomize_question_order: false,
    button_label: CONTINUE_BUTTON_MESSAGE(),
    on_load() {
      narration.play(`assets/audio/likert-amf-preamble.mp3`);
    },
    on_finish() {
      narration.stop();
    },
  },
];
// Randomizes the first 6 likert questions asked after a trial block.
export const likertQuestions2Randomized = (
  jsPsych: JsPsych,
  narration: AudioNarration,
): Timeline =>
  jsPsych.randomization.sampleWithoutReplacement(
    likertQuestions2(narration),
    6,
  );
