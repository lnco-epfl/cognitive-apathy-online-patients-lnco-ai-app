import { type FC, useState } from 'react';

import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Tab } from '@mui/material';

import ResultsView from '../answers/ResultsView';
import SettingsView from '../settings/SettingsView';

enum Tabs {
  RESULTS_VIEW = 'RESULTS_VIEW',
  SETTINGS_VIEW = 'SETTINGS_VIEW',
}

const AdminView: FC = () => {
  const [activeTab, setActiveTab] = useState(Tabs.RESULTS_VIEW);

  return (
    <Box>
      <TabContext value={activeTab}>
        <TabList
          textColor="secondary"
          indicatorColor="secondary"
          onChange={(_, newTab: Tabs) => setActiveTab(newTab)}
          centered
        >
          <Tab value={Tabs.RESULTS_VIEW} label="Results" iconPosition="start" />
          <Tab
            value={Tabs.SETTINGS_VIEW}
            label="Settings"
            iconPosition="start"
          />
        </TabList>
        <TabPanel value={Tabs.RESULTS_VIEW}>
          <ResultsView />
        </TabPanel>
        <TabPanel value={Tabs.SETTINGS_VIEW}>
          <SettingsView />
        </TabPanel>
      </TabContext>
    </Box>
  );
};
export default AdminView;
