import { FC } from 'react';

import { TextField, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

// eslint-disable-next-line import/no-extraneous-dependencies
import { PracticeSettingsType } from '../context/SettingsContext';

type PracticeSettingsViewProps = {
  practiceSettings: PracticeSettingsType;
  onChange: (newSetting: PracticeSettingsType) => void;
};

const PracticeSettingsView: FC<PracticeSettingsViewProps> = ({
  practiceSettings,
  onChange,
}) => (
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
        onChange({
          numberOfPracticeLoops: Number(e.target.value),
        })
      }
    />
  </Stack>
);

export default PracticeSettingsView;
