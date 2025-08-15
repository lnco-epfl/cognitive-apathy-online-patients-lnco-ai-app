import { FC } from 'react';

import { TextField, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

// eslint-disable-next-line import/no-extraneous-dependencies
import { CalibrationSettingsType } from '../context/SettingsContext';
import { CalibrationPartType } from '../experiment/utils/types';

type CalibrationSettingsViewProps = {
  calibrationSettings: CalibrationSettingsType;
  onChange: (newSetting: CalibrationSettingsType) => void;
};

const CalibrationSettingsView: FC<CalibrationSettingsViewProps> = ({
  calibrationSettings,
  onChange,
}) => (
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
        onChange({
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
        onChange({
          ...calibrationSettings,
          requiredTrialsCalibration: {
            [CalibrationPartType.CalibrationPart1]: Number(e.target.value),
            [CalibrationPartType.CalibrationPart2]: Number(e.target.value),
            [CalibrationPartType.FinalCalibrationPart1]: Number(e.target.value),
            [CalibrationPartType.FinalCalibrationPart2]: Number(e.target.value),
          },
        })
      }
    />
  </Stack>
);

export default CalibrationSettingsView;
