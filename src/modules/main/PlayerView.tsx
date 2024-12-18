import { PLAYER_VIEW_CY } from '@/config/selectors';

import { ExperimentLoader } from './ExperimentLoader';

const PlayerView = (): JSX.Element => (
  <div data-cy={PLAYER_VIEW_CY} className="player-view">
    <ExperimentLoader />
  </div>
);
export default PlayerView;
