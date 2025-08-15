import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Stack from '@mui/material/Stack';

// eslint-disable-next-line import/no-extraneous-dependencies
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  headingsPlugin,
  listsPlugin,
  toolbarPlugin,
} from '@mdxeditor/editor';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@mdxeditor/editor/style.css';

import { NextStepSettings } from '../context/SettingsContext';

type NextStepSettingsViewProps = {
  nextStepSettings: NextStepSettings;
  onChange: (newSetting: NextStepSettings) => void;
};

const NextStepSettingsView: FC<NextStepSettingsViewProps> = ({
  nextStepSettings,
  onChange,
}) => {
  const { t } = useTranslation();
  const { linkToNextPage, title, description, link, linkText } =
    nextStepSettings || {
      linkToNextPage: false,
      title: '',
      description: '',
      link: '',
      linkText: '',
    };
  return (
    <Stack spacing={1}>
      <FormControlLabel
        control={<Switch />}
        label={t('SETTINGS.NEXT_STEP.LABEL_NEXT_STEP')}
        onChange={(e, checked) =>
          onChange({ ...nextStepSettings, linkToNextPage: checked })
        }
        checked={linkToNextPage}
      />
      {linkToNextPage && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              {t('SETTINGS.NEXT_STEP.LINK_PAGE_LABEL')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <TextField
                value={title}
                label={t('SETTINGS.NEXT_STEP.TITLE_LABEL')}
                onChange={(e) =>
                  onChange({ ...nextStepSettings, title: e.target.value })
                }
              />
              <Typography variant="body1">
                {t('SETTINGS.NEXT_STEP.DESCRIPTION')}
              </Typography>
              <MDXEditor
                markdown={description}
                onChange={(value) =>
                  onChange({ ...nextStepSettings, description: value })
                }
                plugins={[
                  headingsPlugin(),
                  toolbarPlugin({
                    toolbarClassName: 'my-classname',
                    // eslint-disable-next-line react/no-unstable-nested-components
                    toolbarContents: () => (
                      <>
                        {' '}
                        <BlockTypeSelect />
                        <UndoRedo />
                        <BoldItalicUnderlineToggles />
                        <ListsToggle />
                      </>
                    ),
                  }),
                  listsPlugin(),
                ]}
              />
              <TextField
                value={link}
                label={t('SETTINGS.NEXT_STEP.LINK_LABEL')}
                onChange={(e) =>
                  onChange({ ...nextStepSettings, link: e.target.value })
                }
              />
              <TextField
                value={linkText}
                label={t('SETTINGS.NEXT_STEP.LINK_TEXT_LABEL')}
                onChange={(e) =>
                  onChange({ ...nextStepSettings, linkText: e.target.value })
                }
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Stack>
  );
};

export default NextStepSettingsView;
