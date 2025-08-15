import { FC } from 'react';

import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';

// eslint-disable-next-line import/no-extraneous-dependencies
import { TaskSettingsType } from '../context/SettingsContext';
import { BoundsType, DelayType, RewardType } from '../experiment/utils/types';

type TaskSettingsViewProps = {
  taskSettings: TaskSettingsType;
  onChange: (newSetting: TaskSettingsType) => void;
};

const TaskSettingsView: FC<TaskSettingsViewProps> = ({
  taskSettings,
  onChange,
}) => {
  const delayItemElements = Object.values(DelayType).map(
    (delayType: DelayType, index) => (
      <FormControlLabel
        key={index}
        control={
          <Checkbox
            checked={taskSettings.taskBlocksIncluded.includes(delayType)}
          />
        }
        label={delayType}
        onChange={(e, checked) => {
          onChange({
            ...taskSettings,
            taskBlocksIncluded: !checked
              ? taskSettings.taskBlocksIncluded.filter((i) => i !== delayType)
              : [...taskSettings.taskBlocksIncluded, delayType],
          });
        }}
      />
    ),
  );

  const boundsItemElements = Object.values(BoundsType).map(
    (boundsType: BoundsType, index) => (
      <FormControlLabel
        key={index}
        control={
          <Checkbox
            checked={taskSettings.taskBoundsIncluded.includes(boundsType)}
          />
        }
        label={boundsType}
        onChange={(e, checked) => {
          onChange({
            ...taskSettings,
            taskBoundsIncluded: !checked
              ? taskSettings.taskBoundsIncluded.filter((i) => i !== boundsType)
              : [...taskSettings.taskBoundsIncluded, boundsType],
          });
        }}
      />
    ),
  );
  const rewardItemElements = Object.values(RewardType).map(
    (rewardType: RewardType, index) => (
      <FormControlLabel
        key={index}
        control={
          <Checkbox
            checked={taskSettings.taskRewardsIncluded.includes(rewardType)}
          />
        }
        label={rewardType}
        onChange={(e, checked) => {
          onChange({
            ...taskSettings,
            taskRewardsIncluded: !checked
              ? taskSettings.taskRewardsIncluded.filter((i) => i !== rewardType)
              : [...taskSettings.taskRewardsIncluded, rewardType],
          });
        }}
      />
    ),
  );

  return (
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
      <FormGroup>{delayItemElements}</FormGroup>
      <Stack spacing={0}>
        <Typography variant="body1">
          Which reward levels should be included?
        </Typography>
        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
          Each Reward / Effort permutation is included at least once per Trial
          Block
        </Typography>
      </Stack>
      <FormGroup>{rewardItemElements}</FormGroup>
      <Stack spacing={0}>
        <Typography variant="body1">
          Which effort levels should be included?
        </Typography>
        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
          Each Reward / Effort permutation is included at least once per Trial
          Block
        </Typography>
      </Stack>
      <FormGroup>{boundsItemElements}</FormGroup>
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
          onChange({
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
          onChange({
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
          onChange({
            ...taskSettings,
            randomSkipChance: Number(e.target.value),
          })
        }
      />
    </Stack>
  );
};

export default TaskSettingsView;
