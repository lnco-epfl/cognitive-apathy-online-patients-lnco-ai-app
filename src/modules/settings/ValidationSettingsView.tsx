import { FC } from 'react';

import { TextField, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ValidationSettingsType } from '../context/SettingsContext';

type ValidationSettingsViewProps = {
  validationSettings: ValidationSettingsType;
  onChange: (newSetting: ValidationSettingsType) => void;
};

const ValidationSettingsView: FC<ValidationSettingsViewProps> = ({
  validationSettings,
  onChange,
}) => (
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
        onChange({
          ...validationSettings,
          numberOfValidationsPerType: Number(e.target.value),
        })
      }
    />
    <Stack spacing={0}>
      <Typography variant="body1">
        Percentage of validations completed successfully to pass validation (per
        effort level)
      </Typography>
      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
        Please write percentages as full numbers (so 50 means 50%)
      </Typography>
    </Stack>
    <TextField
      value={validationSettings.percentageOfValidationSuccessesRequired}
      onChange={(e) =>
        onChange({
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
      value={validationSettings.percentageOfExtraValidationSuccessesRequired}
      onChange={(e) =>
        onChange({
          ...validationSettings,
          percentageOfExtraValidationSuccessesRequired: Number(e.target.value),
        })
      }
    />
  </Stack>
);

export default ValidationSettingsView;
