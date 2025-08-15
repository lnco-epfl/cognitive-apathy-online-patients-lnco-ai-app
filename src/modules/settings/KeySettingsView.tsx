import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';

import { KeySettings, OptionalKeys } from '../context/SettingsContext';

type KeySettingsViewProps = {
  keySettings: KeySettings;
  onChange: (newSetting: KeySettings) => void;
};

const KeySettingsView: FC<KeySettingsViewProps> = ({
  keySettings,
  onChange,
}) => {
  const { t } = useTranslation();
  const { leftIndex, leftMiddle, leftRing, leftPink, leftThumb, rightIndex } =
    keySettings || {
      leftIndex: 'f',
      leftMiddle: 'e',
    };

  const [enabledKeys, setEnabledKeys] = useState({
    leftRing: !!leftRing,
    leftPink: !!leftPink,
    leftThumb: !!leftThumb,
    rightIndex: !!rightIndex,
  });

  const [keyChangeModal, setKeyChangeModalOpen] = useState(false);
  const [currentKeySetting, setCurrentKeySetting] = useState<
    keyof KeySettings | null
  >(null);

  const handleKeyChange = (keyType: keyof KeySettings): void => {
    setCurrentKeySetting(keyType);
    setKeyChangeModalOpen(true);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      event.preventDefault();
      if (currentKeySetting) {
        const newSettings = {
          ...keySettings,
          [currentKeySetting]: event.key.toLowerCase(),
        };
        onChange(newSettings);
        setKeyChangeModalOpen(false);
      }
    };
    if (keyChangeModal) {
      window.addEventListener('keydown', handleKeyPress);
    } else {
      window.removeEventListener('keydown', handleKeyPress);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentKeySetting, keyChangeModal, keySettings, onChange]);

  const toggleKey = (key: keyof OptionalKeys): void => {
    setEnabledKeys((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      if (!updated[key]) {
        const newSettings = { ...keySettings };
        delete newSettings[key];
        onChange(newSettings);
      }
      return updated;
    });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Configure Keys Used</Typography>

      <Box display="flex" alignItems="center" gap={1}>
        <TextField
          value={leftIndex.toUpperCase()}
          label="Left Index (Tapping Key)"
          disabled
        />
        <Button
          variant="contained"
          onClick={() => handleKeyChange('leftIndex')}
        >
          Change Key
        </Button>
      </Box>

      <Box display="flex" alignItems="center" gap={1}>
        <TextField
          value={leftMiddle.toUpperCase()}
          label="Left Middle (Hold Key)"
          disabled
        />
        <Button
          variant="contained"
          onClick={() => handleKeyChange('leftMiddle')}
        >
          Change Key
        </Button>
      </Box>

      {(
        [
          'leftRing',
          'leftPink',
          'leftThumb',
          'rightIndex',
        ] as (keyof typeof enabledKeys)[]
      ).map((key) => (
        <Box key={key} display="flex" alignItems="center" gap={1}>
          <Switch checked={enabledKeys[key]} onChange={() => toggleKey(key)} />
          {enabledKeys[key] && (
            <>
              <TextField
                value={
                  keySettings[key] === ' '
                    ? 'SPACEBAR'
                    : keySettings[key]?.toUpperCase() || ''
                }
                label={`${t(key)} (Hold key)`}
                disabled
              />
              <Button variant="contained" onClick={() => handleKeyChange(key)}>
                Change Key
              </Button>
            </>
          )}
        </Box>
      ))}

      <Dialog
        open={keyChangeModal}
        onClose={() => setKeyChangeModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Press the new key</DialogTitle>
      </Dialog>
    </Stack>
  );
};

export default KeySettingsView;
