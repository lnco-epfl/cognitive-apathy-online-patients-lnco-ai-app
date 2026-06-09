import { Stack } from '@mui/material';

import { useLocalContext } from '@lnco-ai/apps-query-client';
import { PermissionLevel } from '@lnco-ai/sdk';

import { BUILDER_VIEW_CY } from '@/config/selectors';

import AdminView from './AdminView';
import PlayerView from './PlayerView';

const BuilderView = (): JSX.Element => {
  const { permission } = useLocalContext();

  let mainView;
  switch (permission) {
    // show "teacher view"
    case PermissionLevel.Admin:
      mainView = <AdminView />;
      break;
    case PermissionLevel.Read:
    default:
      mainView = <PlayerView />;
      break;
  }

  return (
    <div
      data-cy={BUILDER_VIEW_CY}
      style={{
        whiteSpace: 'pre-line',
        backgroundColor: '#fffefe',
      }}
    >
      <Stack direction="column" spacing={2}>
        {mainView}
      </Stack>
    </div>
  );
};
export default BuilderView;
