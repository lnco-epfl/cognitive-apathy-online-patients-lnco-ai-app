import { FC, useMemo, useState } from 'react';

import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';

import { isEqual } from 'lodash';

import {
  AllowedLanguages,
  CalibrationSettingsType,
  GeneralSettingsType,
  KeySettings,
  NextStepSettings,
  PhotoDiodeSettings,
  PracticeSettingsType,
  TaskSettingsType,
  ValidationSettingsType,
  useSettings,
} from '../context/SettingsContext';
import CalibrationSettingsView from './CalibrationSettingsView';
import GeneralSettingsView from './GeneralSettingsView';
import KeySettingsView from './KeySettingsView';
import NextStepSettingsView from './NextStepSettings';
import PhotoDiodeSettingsView from './PhotoDiodeSettingsView';
import PracticeSettingsView from './PracticeSettingsView';
import TaskSettingsView from './TaskSettingsView';
import ValidationSettingsView from './ValidationSettingsView';

const SettingsView: FC = () => {
  const {
    generalSettings: generalSettingsSaved,
    languageSettings: languageSettingsSaved,
    practiceSettings: practiceSettingsSaved,
    calibrationSettings: calibrationSettingsSaved,
    validationSettings: validationSettingsSaved,
    taskSettings: taskSettingsSaved,
    photoDiodeSettings: photoDiodeSettingsSaved,
    keySettings: keySettingsSaved,
    nextStepSettings: nextStepSettingsSaved,
    saveSettings,
  } = useSettings();

  const [generalSettings, updateGeneralSettings] =
    useState<GeneralSettingsType>(generalSettingsSaved);
  const [languageSettings, updateLanguageSettings] = useState(
    languageSettingsSaved,
  );
  const [practiceSettings, updatePracticeSettings] =
    useState<PracticeSettingsType>(practiceSettingsSaved);
  const [calibrationSettings, updateCalibrationSettings] =
    useState<CalibrationSettingsType>(calibrationSettingsSaved);
  const [validationSettings, updateValidationSettings] =
    useState<ValidationSettingsType>(validationSettingsSaved);
  const [taskSettings, updateTaskSettings] =
    useState<TaskSettingsType>(taskSettingsSaved);
  const [photoDiodeSettings, updatePhotoDiodeSettings] =
    useState<PhotoDiodeSettings>(photoDiodeSettingsSaved);
  const [keySettings, updateKeySettings] =
    useState<KeySettings>(keySettingsSaved);
  const [nextStepSettings, updateNextStepSettings] = useState<NextStepSettings>(
    nextStepSettingsSaved,
  );

  const saveAllSettings = (): void => {
    saveSettings('generalSettings', generalSettings);
    saveSettings('languageSettings', languageSettings);
    saveSettings('practiceSettings', practiceSettings);
    saveSettings('calibrationSettings', calibrationSettings);
    saveSettings('validationSettings', validationSettings);
    saveSettings('taskSettings', taskSettings);
    saveSettings('photoDiodeSettings', photoDiodeSettings);
    saveSettings('keySettings', keySettings);
    saveSettings('nextStepSettings', nextStepSettings);
  };

  const disableSave = useMemo(() => {
    if (
      isEqual(generalSettingsSaved, generalSettings) &&
      isEqual(languageSettingsSaved, languageSettings) &&
      isEqual(practiceSettingsSaved, practiceSettings) &&
      isEqual(calibrationSettingsSaved, calibrationSettings) &&
      isEqual(validationSettingsSaved, validationSettings) &&
      isEqual(taskSettingsSaved, taskSettings) &&
      isEqual(photoDiodeSettingsSaved, photoDiodeSettings) &&
      isEqual(keySettingsSaved, keySettings) &&
      isEqual(nextStepSettingsSaved, nextStepSettings)
    ) {
      return true;
    }
    return false;
  }, [
    generalSettingsSaved,
    generalSettings,
    languageSettings,
    languageSettingsSaved,
    practiceSettingsSaved,
    practiceSettings,
    calibrationSettingsSaved,
    calibrationSettings,
    validationSettingsSaved,
    validationSettings,
    taskSettingsSaved,
    taskSettings,
    photoDiodeSettingsSaved,
    photoDiodeSettings,
    keySettingsSaved,
    keySettings,
    nextStepSettingsSaved,
    nextStepSettings,
  ]);

  return (
    <Stack spacing={2}>
      <Typography variant="h3">Settings</Typography>
      <GeneralSettingsView
        generalSettings={generalSettings}
        onChange={updateGeneralSettings}
      />
      <Stack spacing={1}>
        <Typography variant="h6">Language</Typography>
        <RadioGroup
          aria-labelledby="demo-radio-buttons-group-label"
          defaultValue="random"
          name="radio-buttons-group"
          row
          value={languageSettings.language}
          onChange={(e) =>
            updateLanguageSettings({
              language: e.target.value as AllowedLanguages,
            })
          }
        >
          <FormControlLabel value="en" control={<Radio />} label="English" />
          <FormControlLabel value="fr" control={<Radio />} label="French" />
        </RadioGroup>
      </Stack>
      <PracticeSettingsView
        practiceSettings={practiceSettings}
        onChange={updatePracticeSettings}
      />
      <CalibrationSettingsView
        calibrationSettings={calibrationSettings}
        onChange={updateCalibrationSettings}
      />
      <ValidationSettingsView
        validationSettings={validationSettings}
        onChange={updateValidationSettings}
      />
      <TaskSettingsView
        taskSettings={taskSettings}
        onChange={updateTaskSettings}
      />
      <PhotoDiodeSettingsView
        photoDiodeSettings={photoDiodeSettings}
        onChange={updatePhotoDiodeSettings}
      />
      <NextStepSettingsView
        nextStepSettings={nextStepSettings}
        onChange={updateNextStepSettings}
      />
      <KeySettingsView keySettings={keySettings} onChange={updateKeySettings} />
      <Box>
        <Button
          variant="contained"
          onClick={saveAllSettings}
          disabled={disableSave}
        >
          Save
        </Button>
      </Box>
    </Stack>
  );
};

export default SettingsView;
