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
import { PhotoDiodeSettings } from '../context/SettingsContext';

type PhotoDiodeSettingsViewProps = {
  photoDiodeSettings: PhotoDiodeSettings;
  onChange: (newSetting: PhotoDiodeSettings) => void;
};

const isError = (value: string | undefined): boolean => {
  if (!value) return true;
  return !(value.endsWith('px') || value.endsWith('%'));
};

const PhotoDiodeSettingsView: FC<PhotoDiodeSettingsViewProps> = ({
  photoDiodeSettings,
  onChange,
}) => (
  <Stack spacing={1}>
    <Stack spacing={0}>
      <Typography variant="h6">Photo Diode Settings</Typography>
      <Typography variant="body1">
        Add a trigger for a photodiode on the screen
      </Typography>
      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
        Select <b>customize</b> to configure a custom location for the
        photodiode
      </Typography>
    </Stack>
    <RadioGroup
      aria-labelledby="demo-radio-buttons-group-label"
      defaultValue="random"
      name="radio-buttons-group"
      row
      value={photoDiodeSettings.usePhotoDiode}
      onChange={(e) =>
        onChange({
          ...photoDiodeSettings,
          usePhotoDiode: e.target.value as
            | 'top-left'
            | 'top-right'
            | 'customize'
            | 'off',
        })
      }
    >
      <FormControlLabel value="top-left" control={<Radio />} label="top-left" />
      <FormControlLabel
        value="top-right"
        control={<Radio />}
        label="top-right"
      />
      <FormControlLabel
        value="customize"
        control={<Radio />}
        label="customize"
      />
      <FormControlLabel value="off" control={<Radio />} label="off" />
    </RadioGroup>
    <Stack spacing={0}>
      <Typography variant="body1">
        Test photodiode location (when enabled, the photodiode location will be
        displayed in red, go to the Playerview to confirm the location)
      </Typography>
    </Stack>
    <FormControlLabel
      control={<Switch />}
      label="Enable Test Mode"
      onChange={(e, checked) => {
        onChange({
          ...photoDiodeSettings,
          testPhotoDiode: checked,
        });
      }}
      checked={photoDiodeSettings.testPhotoDiode}
    />
    {photoDiodeSettings.usePhotoDiode === 'customize' && (
      <Stack spacing={1}>
        <Typography variant="h6">PhotoDiode Position</Typography>
        <Typography variant="body1">
          Distance from the left-side of the screen (end with px or %)
        </Typography>
        <TextField
          value={photoDiodeSettings.photoDiodeLeft}
          label="Left"
          onChange={(e) =>
            onChange({
              ...photoDiodeSettings,
              photoDiodeLeft: e.target.value,
            })
          }
          error={isError(photoDiodeSettings.photoDiodeLeft)}
        />
        <Typography variant="body1">
          Distance from the top of the screen (end with px or %)
        </Typography>
        <TextField
          value={photoDiodeSettings.photoDiodeTop}
          label="Top"
          onChange={(e) =>
            onChange({
              ...photoDiodeSettings,
              photoDiodeTop: e.target.value,
            })
          }
          error={isError(photoDiodeSettings.photoDiodeTop)}
        />
        <Typography variant="body1">
          Width of the photodiode trigger (end with px or %)
        </Typography>
        <TextField
          value={photoDiodeSettings.photoDiodeWidth}
          label="Width"
          onChange={(e) =>
            onChange({
              ...photoDiodeSettings,
              photoDiodeWidth: e.target.value,
            })
          }
          error={isError(photoDiodeSettings.photoDiodeWidth)}
        />
        <Typography variant="body1">
          Height of the photodiode trigger (end with px or %)
        </Typography>
        <TextField
          value={photoDiodeSettings.photoDiodeHeight}
          label="Height"
          onChange={(e) =>
            onChange({
              ...photoDiodeSettings,
              photoDiodeHeight: e.target.value,
            })
          }
          error={isError(photoDiodeSettings.photoDiodeHeight)}
        />
      </Stack>
    )}
  </Stack>
);

export default PhotoDiodeSettingsView;
