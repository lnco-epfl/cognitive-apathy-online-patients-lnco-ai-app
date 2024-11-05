import { type JsPsych } from 'jspsych';

import { type ExperimentState } from '../jspsych/experiment-state-class';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Timeline = any[];

export type Trial = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: unknown;
} & Record<string, unknown>;

export enum CalibrationPartType {
  CalibrationPart1 = 'calibrationPart1',
  CalibrationPart2 = 'calibrationPart2',
  FinalCalibrationPart1 = 'finalCalibrationPart1',
  FinalCalibrationPart2 = 'finalCalibrationPart2',
}

export enum ValidationPartType {
  ValidationEasy = 'validationEasy',
  ValidationMedium = 'validationMedium',
  ValidationHard = 'validationHard',
  ValidationExtra = 'validationExtra',
}

export enum OtherTaskStagesType {
  Practice = 'practice',
  Countdown = 'countdown',
  Demo = 'demo',
  Success = 'success',
  Accept = 'accept',
  Block = 'block',
}

export type TaskStagesType =
  | OtherTaskStagesType
  | ValidationPartType
  | CalibrationPartType;

// Define the CalibrationTrialParams interface
export interface CalibrationTrialParams {
  showThermometer: boolean;
  bounds: number[];
  calibrationPart: CalibrationPartType;
  jsPsych: JsPsych;
  state: ExperimentState;
}

// Define the ConditionalCalibrationTrialParams interface
export interface ConditionalCalibrationTrialParams {
  calibrationPart: CalibrationPartType;
  jsPsych: JsPsych;
  state: ExperimentState;
}

interface MedianTaps {
  calibrationPart1Median: number;
  calibrationPart2Median: number;
}

export interface ValidationData {
  task: string;
  success: boolean;
}

export enum DelayType {
  Sync = 'sync',
  NarrowAsync = 'narrowasync',
  WideAsync = 'wideasync',
}

export enum BoundsType {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export enum RewardType {
  Low = 'low',
  Middle = 'middle',
  High = 'high',
}

export enum NoRewardType {
  No = 'no',
}

export type FullRewardType = NoRewardType | RewardType;

export type TrialSettingsType = {
  delay: [number, number];
  reward: number;
  bounds: [number, number];
};

export interface TaskTrialData {
  tapCount: number;
  startTime: number;
  endTime: number;
  mercuryHeight: number;
  error: string;
  bounds: number[];
  reward: number;
  task: string;
  errorOccurred: boolean;
  keysReleasedFlag: boolean;
  success: boolean;
  keyTappedEarlyFlag: boolean;
  accepted?: boolean; // Added accepted as optional
  response?: string;
  minimumTapsReached?: boolean;
  keysState?: { [key: string]: boolean };
  medianTaps?: MedianTaps; // FIX ANY TYPE
}

export interface PassedTaskData {
  bounds: number[];
  originalBounds: number[];
  reward: number;
  accepted?: boolean; // Added accepted as optional
  randomDelay: number[];
  randomChanceAccepted?: boolean;
}

export interface CreateTrialBlockParams {
  blockName?: string;
  randomDelay: [number, number];
  bounds?: [number, number];
  includeDemo?: boolean;
  jsPsych: JsPsych;
  state: ExperimentState;
}

export type TrialOrdersType = Record<string, Trial[][][]>;
