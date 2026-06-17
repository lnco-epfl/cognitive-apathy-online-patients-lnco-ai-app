import { DataCollection, JsPsych } from 'jspsych';

import { countdownStep } from '../trials/countdown-trial';
import { loadingBarTrial } from '../trials/loading-bar-trial';
import { releaseKeysStep } from '../trials/release-keys-trial';
import { successScreenFreezeFrame } from '../trials/success-trial';
import TappingTask, { TappingTaskDataType } from '../trials/tapping-task-trial';
import { DeviceType } from '../triggers/serialport';
import { sendPhotoDiodeTrigger, sendSerialTrigger } from '../triggers/trigger';
import {
  AUTO_DECREASE_AMOUNT,
  AUTO_DECREASE_RATE,
  EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
  MAX_CALIBRATION_CONSECUTIVE_LOW_TAP_FAILURES,
  TRIAL_DURATION,
} from '../utils/constants';
import { CalibrationPartType, Trial, TrialTypes } from '../utils/types';
import {
  autoIncreaseAmountCalculation,
  checkFlag,
  checkKeys,
  getHoldKeys,
  getTapKey,
} from '../utils/utils';
import { ExperimentState } from './experiment-state-class';
import { finishExperimentEarly } from './finish';

/**
 * Creates a calibration trial with countdown, tapping task, release-keys check,
 * success screen, and loading bar. Loops until the required number of successes
 * is reached for the given calibration part.
 */
export const calibrationTrial = (
  jsPsych: JsPsych,
  state: ExperimentState,
  calibrationPart: CalibrationPartType,
  updateData: (data: DataCollection) => void,
  device: DeviceType,
): Trial => {
  let consecutiveLowTapFailures = 0;
  return {
    timeline: [
      {
        timeline: [
          countdownStep(state),
          {
            type: TappingTask,
            keysToHold() {
              return getHoldKeys(state);
            },
            keyToPress() {
              return getTapKey(state);
            },
            task: calibrationPart,
            trial_duration: TRIAL_DURATION,
            showThermometer: [
              CalibrationPartType.CalibrationPart2,
              CalibrationPartType.FinalCalibrationPart2,
            ].includes(calibrationPart),
            bounds: [
              EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
              EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
            ],
            autoIncreaseAmount() {
              let median: number;
              if (calibrationPart === CalibrationPartType.CalibrationPart2) {
                median = state.getCalibrationPart2Seed();
              } else if (
                calibrationPart === CalibrationPartType.FinalCalibrationPart2
              ) {
                median = state.getFinalCalibrationPart2Seed();
              } else {
                median =
                  state.getState().medianTaps[
                    CalibrationPartType.CalibrationPart1
                  ];
              }
              return autoIncreaseAmountCalculation(
                EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
                TRIAL_DURATION,
                AUTO_DECREASE_RATE,
                AUTO_DECREASE_AMOUNT,
                median,
                [0, 0],
              );
            },
            on_start(trial: Trial) {
              if (device.device) {
                sendSerialTrigger(device, {
                  outsideTask: true,
                  decisionTrigger: false,
                  isEnd: false,
                });
              }
              sendPhotoDiodeTrigger(
                state.getPhotoDiodeSettings().usePhotoDiode,
                false,
              );
              // eslint-disable-next-line no-param-reassign
              trial.keyTappedEarlyFlag = checkFlag(
                TrialTypes.CountdownTask,
                'keyTappedEarlyFlag',
                jsPsych,
              );
            },
            on_finish(data: TappingTaskDataType) {
              if (device.device) {
                sendSerialTrigger(device, {
                  outsideTask: true,
                  decisionTrigger: false,
                  isEnd: true,
                });
              }
              sendPhotoDiodeTrigger(
                state.getPhotoDiodeSettings().usePhotoDiode,
                true,
              );

              const genuineTrial =
                !data.keysReleasedFlag && !data.keyTappedEarlyFlag;
              const belowMinimum =
                data.tapCount <
                state.getCalibrationSettings().minimumCalibrationMedianTaps;

              if (genuineTrial) {
                if (belowMinimum) {
                  consecutiveLowTapFailures += 1;
                  if (
                    consecutiveLowTapFailures >=
                    MAX_CALIBRATION_CONSECUTIVE_LOW_TAP_FAILURES
                  ) {
                    finishExperimentEarly(jsPsych, state, updateData);
                  }
                } else {
                  consecutiveLowTapFailures = 0;
                  if (
                    calibrationPart ===
                    CalibrationPartType.FinalCalibrationPart2
                  ) {
                    state.pushFinalCalibrationPart2TapCount(data.tapCount);
                  } else if (
                    calibrationPart === CalibrationPartType.CalibrationPart2
                  ) {
                    state.pushCalibrationPart2TapCount(data.tapCount);
                  }
                }
              }
            },
          } as unknown as Trial,
          {
            timeline: [releaseKeysStep(state)],
            conditional_function() {
              return checkKeys(jsPsych);
            },
          },
          {
            ...successScreenFreezeFrame(jsPsych, false, state),
          },
          {
            ...loadingBarTrial(true, jsPsych),
          },
        ],
        loop_function() {
          return (
            state.getRequiredSuccesses(calibrationPart) >
            state.getCurrentSuccesses(calibrationPart)
          );
        },
      },
    ],
    on_timeline_finish() {
      if (calibrationPart === CalibrationPartType.FinalCalibrationPart2) {
        const lastTrial = jsPsych.data.get().last(1).values()[0];
        if (lastTrial) {
          lastTrial.experimentCompleted = true;
        }
      }
      updateData(jsPsych.data.get());
    },
  };
};
