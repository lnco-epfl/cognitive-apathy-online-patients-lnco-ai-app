import { FC } from 'react';

import {
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';

// eslint-disable-next-line import/no-extraneous-dependencies
import { GeneralSettingsType } from '../context/SettingsContext';

type GeneralSettingsViewProps = {
  generalSettings: GeneralSettingsType;
  onChange: (newSetting: GeneralSettingsType) => void;
};

const GeneralSettingsView: FC<GeneralSettingsViewProps> = ({
  generalSettings,
  onChange,
}) => (
  <Stack spacing={1}>
    <Typography variant="h6">General Settings</Typography>
    <Stack spacing={0}>
      <Typography variant="body1">
        Set the font size of the experiment
      </Typography>
    </Stack>
    <RadioGroup
      aria-labelledby="demo-radio-buttons-group-label"
      defaultValue="random"
      name="radio-buttons-group"
      row
      value={generalSettings.fontSize}
      onChange={(e) =>
        onChange({
          ...generalSettings,
          fontSize: e.target.value as
            | 'small'
            | 'normal'
            | 'large'
            | 'extra-large',
        })
      }
    >
      <FormControlLabel value="small" control={<Radio />} label="Small" />
      <FormControlLabel value="normal" control={<Radio />} label="Normal" />
      <FormControlLabel value="large" control={<Radio />} label="Large" />
      <FormControlLabel
        value="extra-large"
        control={<Radio />}
        label="Extra Large"
      />
    </RadioGroup>
    <FormControlLabel
      control={<Switch />}
      label="Use External Device"
      onChange={(e, checked) => {
        onChange({
          ...generalSettings,
          useDevice: checked,
        });
      }}
      checked={generalSettings.useDevice}
    />
    <Stack spacing={0}>
      <Typography variant="body1">
        Prolific URL for early finishers that fail the experiment early
      </Typography>
      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
        When a participant fails calibration or validation, they will be sent to
        prolific with a link for failed experiments
      </Typography>
    </Stack>
    <TextField
      value={generalSettings.earlyFinishLink}
      onChange={(e) =>
        onChange({
          ...generalSettings,
          earlyFinishLink: e.target.value,
        })
      }
    />
  </Stack>
);

export default GeneralSettingsView;
