import { FC, useState } from 'react';

import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';

import {
  CalibrationSettingsType,
  PracticeSettingsType,
  TaskSettingsType,
  ValidationSettingsType,
  useSettings,
} from '../context/SettingsContext';
import {
  BoundsType,
  CalibrationPartType,
  DelayType,
  RewardType,
} from '../experiment/utils/types';

const SettingsView: FC = () => {
  const {
    practiceSettings: practiceSettingsSaved,
    calibrationSettings: calibrationSettingsSaved,
    validationSettings: validationSettingsSaved,
    taskSettings: taskSettingsSaved,
    saveSettings,
  } = useSettings();

  const [practiceSettings, updatePracticeSettings] =
    useState<PracticeSettingsType>(practiceSettingsSaved);
  const [calibrationSettings, updateCalibrationSettings] =
    useState<CalibrationSettingsType>(calibrationSettingsSaved);
  const [validationSettings, updateValidationSettings] =
    useState<ValidationSettingsType>(validationSettingsSaved);
  const [taskSettings, updateTaskSettings] =
    useState<TaskSettingsType>(taskSettingsSaved);

  const saveAllSettings = (): void => {
    saveSettings('practiceSettings', practiceSettings);
    saveSettings('calibrationSettings', calibrationSettings);
    saveSettings('validationSettings', validationSettings);
    saveSettings('taskSettings', taskSettings);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h3">Settings</Typography>
      <Stack spacing={1}>
        <Typography variant="h6">Practice</Typography>
        <Stack spacing={0}>
          <Typography variant="body1">
            Number of practice loops at the very beginning of the experiment
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            There will always be a single practice loop required
          </Typography>
        </Stack>
        <TextField
          value={practiceSettings.numberOfPracticeLoops}
          onChange={(e) =>
            updatePracticeSettings({
              numberOfPracticeLoops: Number(e.target.value),
            })
          }
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h6">Calibration</Typography>
        <Stack spacing={0}>
          <Typography variant="body1">
            Minimum number of taps required to pass a calibration part
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            When a calibration part does not reach this minimum twice, the
            experiment will end (default: 10)
          </Typography>
        </Stack>
        <TextField
          value={calibrationSettings.minimumCalibrationMedianTaps}
          onChange={(e) =>
            updateCalibrationSettings({
              ...calibrationSettings,
              minimumCalibrationMedianTaps: Number(e.target.value),
            })
          }
        />
        <Stack spacing={0}>
          <Typography variant="body1">
            Total calibration trails per calibration step
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            The calibration result will be based on an average of these trails,
            minimum 1 trial will be required
          </Typography>
        </Stack>
        <TextField
          value={calibrationSettings.requiredTrialsCalibration.calibrationPart1}
          onChange={(e) =>
            updateCalibrationSettings({
              ...calibrationSettings,
              requiredTrialsCalibration: {
                [CalibrationPartType.CalibrationPart1]: Number(e.target.value),
                [CalibrationPartType.CalibrationPart2]: Number(e.target.value),
                [CalibrationPartType.FinalCalibrationPart1]: Number(
                  e.target.value,
                ),
                [CalibrationPartType.FinalCalibrationPart2]: Number(
                  e.target.value,
                ),
              },
            })
          }
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h6">Validation</Typography>
        <Stack spacing={0}>
          <Typography variant="body1">
            Number of validations performed per effort level included in the
            experiment
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            At least 1 validation will be performed per effort level
          </Typography>
        </Stack>
        <TextField
          value={validationSettings.numberOfValidationsPerType}
          onChange={(e) =>
            updateValidationSettings({
              ...validationSettings,
              numberOfValidationsPerType: Number(e.target.value),
            })
          }
        />
        <Stack spacing={0}>
          <Typography variant="body1">
            Percentage of validations completed successfully to pass validation
            (per effort level)
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            Please write percentages as full numbers (so 50 means 50%)
          </Typography>
        </Stack>
        <TextField
          value={validationSettings.percentageOfValidationSuccessesRequired}
          onChange={(e) =>
            updateValidationSettings({
              ...validationSettings,
              percentageOfValidationSuccessesRequired: Number(e.target.value),
            })
          }
        />
        <Stack spacing={0}>
          <Typography variant="body1">
            Percentage of validations completed successfully to pass extra
            validation
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            In case at least one of the validation levels is failed, an extra
            validation is performed, here a lower success level is recommended
          </Typography>
        </Stack>
        <TextField
          value={
            validationSettings.percentageOfExtraValidationSuccessesRequired
          }
          onChange={(e) =>
            updateValidationSettings({
              ...validationSettings,
              percentageOfExtraValidationSuccessesRequired: Number(
                e.target.value,
              ),
            })
          }
        />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h6">Main Task</Typography>
        <Stack spacing={0}>
          <Typography variant="body1">
            Which delay levels should be included?
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            Each Delay level include will mean at least 1 trial block
          </Typography>
        </Stack>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskBlocksIncluded.includes(
                  DelayType.Sync,
                )}
              />
            }
            label="Syncronous"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskBlocksIncluded: !checked
                  ? taskSettings.taskBlocksIncluded.filter(
                      (i) => i !== DelayType.Sync,
                    )
                  : [...taskSettings.taskBlocksIncluded, DelayType.Sync],
              });
            }}
          />
          <FormControlLabel
            defaultChecked
            control={
              <Checkbox
                checked={taskSettings.taskBlocksIncluded.includes(
                  DelayType.NarrowAsync,
                )}
              />
            }
            label="Narrow Asynchronous"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskBlocksIncluded: !checked
                  ? taskSettings.taskBlocksIncluded.filter(
                      (i) => i !== DelayType.NarrowAsync,
                    )
                  : [...taskSettings.taskBlocksIncluded, DelayType.NarrowAsync],
              });
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskBlocksIncluded.includes(
                  DelayType.WideAsync,
                )}
              />
            }
            label="Wide Asyncronous"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskBlocksIncluded: !checked
                  ? taskSettings.taskBlocksIncluded.filter(
                      (i) => i !== DelayType.WideAsync,
                    )
                  : [...taskSettings.taskBlocksIncluded, DelayType.WideAsync],
              });
            }}
          />
        </FormGroup>
        <Stack spacing={0}>
          <Typography variant="body1">
            Which reward levels should be included?
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            Each Reward / Effort permutation is included at least once per Trial
            Block
          </Typography>
        </Stack>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskRewardsIncluded.includes(
                  RewardType.Low,
                )}
              />
            }
            label="Low"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskRewardsIncluded: !checked
                  ? taskSettings.taskRewardsIncluded.filter(
                      (i) => i !== RewardType.Low,
                    )
                  : [...taskSettings.taskRewardsIncluded, RewardType.Low],
              });
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskRewardsIncluded.includes(
                  RewardType.Middle,
                )}
              />
            }
            label="Middle"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskRewardsIncluded: !checked
                  ? taskSettings.taskRewardsIncluded.filter(
                      (i) => i !== RewardType.Middle,
                    )
                  : [...taskSettings.taskRewardsIncluded, RewardType.Middle],
              });
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskRewardsIncluded.includes(
                  RewardType.High,
                )}
              />
            }
            label="High"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskRewardsIncluded: !checked
                  ? taskSettings.taskRewardsIncluded.filter(
                      (i) => i !== RewardType.High,
                    )
                  : [...taskSettings.taskRewardsIncluded, RewardType.High],
              });
            }}
          />
        </FormGroup>
        <Stack spacing={0}>
          <Typography variant="body1">
            Which effort levels should be included?
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            Each Reward / Effort permutation is included at least once per Trial
            Block
          </Typography>
        </Stack>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskBoundsIncluded.includes(
                  BoundsType.Easy,
                )}
              />
            }
            label="Easy"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskBoundsIncluded: !checked
                  ? taskSettings.taskBoundsIncluded.filter(
                      (i) => i !== BoundsType.Easy,
                    )
                  : [...taskSettings.taskBoundsIncluded, BoundsType.Easy],
              });
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskBoundsIncluded.includes(
                  BoundsType.Medium,
                )}
              />
            }
            label="Medium"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskBoundsIncluded: !checked
                  ? taskSettings.taskBoundsIncluded.filter(
                      (i) => i !== BoundsType.Medium,
                    )
                  : [...taskSettings.taskBoundsIncluded, BoundsType.Medium],
              });
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={taskSettings.taskBoundsIncluded.includes(
                  BoundsType.Hard,
                )}
              />
            }
            label="High"
            onChange={(e, checked) => {
              updateTaskSettings({
                ...taskSettings,
                taskBoundsIncluded: !checked
                  ? taskSettings.taskBoundsIncluded.filter(
                      (i) => i !== BoundsType.Hard,
                    )
                  : [...taskSettings.taskBoundsIncluded, BoundsType.Hard],
              });
            }}
          />
        </FormGroup>
        <Stack spacing={0}>
          <Typography variant="body1">
            Number of repetitions per permutation per Trial Block
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            How often each Effort / Reward permutation is repeated per Trial
            Block. <br />
            Current total number of trials per block:{' '}
            {taskSettings.taskBoundsIncluded.length *
              taskSettings.taskRewardsIncluded.length *
              taskSettings.taskPermutationRepetitions}
          </Typography>
        </Stack>
        <TextField
          value={taskSettings.taskPermutationRepetitions}
          onChange={(e) =>
            updateTaskSettings({
              ...taskSettings,
              taskPermutationRepetitions: Number(e.target.value),
            })
          }
        />
        <Stack spacing={0}>
          <Typography variant="body1">
            Number of repetitions of Trial Blocks
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            How often is a trial block repeated per delay. <br />
            Current total number of trials across blocks:{' '}
            {taskSettings.taskBoundsIncluded.length *
              taskSettings.taskRewardsIncluded.length *
              taskSettings.taskPermutationRepetitions *
              taskSettings.taskBlocksIncluded.length *
              taskSettings.taskBlockRepetitions}
          </Typography>
        </Stack>
        <TextField
          value={taskSettings.taskBlockRepetitions}
          onChange={(e) =>
            updateTaskSettings({
              ...taskSettings,
              taskBlockRepetitions: Number(e.target.value),
            })
          }
        />
        <Stack spacing={0}>
          <Typography variant="body1">
            Percentage chance to skip trial after accepting
          </Typography>
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            A percentage at which a subject is not required to perform a trial
            after accepting. Percentage in full numbers (25 = 25%). <br />
            This means 25% of accepted trials will not need to be executed.
          </Typography>
        </Stack>
        <TextField
          value={taskSettings.randomSkipChance}
          onChange={(e) =>
            updateTaskSettings({
              ...taskSettings,
              randomSkipChance: Number(e.target.value),
            })
          }
        />
      </Stack>

      <Box>
        <Button variant="contained" onClick={saveAllSettings}>
          Save
        </Button>
      </Box>
    </Stack>
  );
};

export default SettingsView;
