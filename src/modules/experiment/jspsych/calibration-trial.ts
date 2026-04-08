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
): Trial => ({
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
            const median =
              calibrationPart === CalibrationPartType.CalibrationPart2 ||
              calibrationPart === CalibrationPartType.FinalCalibrationPart2
                ? // Adaptive per-trial seed: T1=20, T2=T1taps, T3=max(T1,T2)
                  state.getCalibrationPart2Seed()
                : // Part1 types: use Part1 median
                  state.getState().medianTaps[
                    CalibrationPartType.CalibrationPart1
                  ];
            return autoIncreaseAmountCalculation(
              EXPECTED_MAXIMUM_PERCENTAGE_FOR_CALIBRATION,
              TRIAL_DURATION,
              AUTO_DECREASE_RATE,
              AUTO_DECREASE_AMOUNT,
              median,
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

            if (
              !data.keysReleasedFlag &&
              !data.keyTappedEarlyFlag &&
              !(
                calibrationPart === CalibrationPartType.FinalCalibrationPart2 &&
                data.tapCount <
                  state.getCalibrationSettings().minimumCalibrationMedianTaps
              )
            ) {
              if (
                calibrationPart === CalibrationPartType.CalibrationPart2 ||
                calibrationPart === CalibrationPartType.FinalCalibrationPart2
              ) {
                state.pushCalibrationPart2TapCount(data.tapCount);
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
          ...successScreenFreezeFrame(jsPsych, false, state.getKeySettings()),
        },
        {
          ...loadingBarTrial(true, jsPsych),
        },
      ],
      loop_function() {
        return (
          state.getRequiredSuccesses(calibrationPart) >
          state.getCurrentSuccesses()
        );
      },
    },
  ],
  on_timeline_finish() {
    updateData(jsPsych.data.get());
  },
});
