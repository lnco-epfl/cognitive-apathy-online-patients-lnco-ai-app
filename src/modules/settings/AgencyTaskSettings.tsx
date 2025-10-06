import { FC } from 'react';

import { TextField, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';

import { AgencyTaskSettingsType } from '../context/SettingsContext';

type AgencySettingsViewProps = {
  agencyTaskSettings: AgencyTaskSettingsType;
  onChange: (newSetting: AgencyTaskSettingsType) => void;
};

const AgencyTaskSettingsView: FC<AgencySettingsViewProps> = ({
  agencyTaskSettings,
  onChange,
}) => (
  <Stack spacing={1}>
    <Typography variant="h6">Agency Tapping Task</Typography>
    <Stack spacing={0}>
      <Typography variant="body1">
        Number of Practice Trials for the Agency Tapping Task
      </Typography>
    </Stack>
    <TextField
      value={agencyTaskSettings.numberOfPracticeTrials}
      onChange={(e) =>
        onChange({
          ...agencyTaskSettings,
          numberOfPracticeTrials: Number(e.target.value),
        })
      }
    />
  </Stack>
);

export default AgencyTaskSettingsView;
