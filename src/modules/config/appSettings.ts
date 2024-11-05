import { BoundsType, DelayType, RewardType } from '../experiment/utils/types';

export const boundsSortOrder = {
  [BoundsType.Easy]: 0,
  [BoundsType.Medium]: 1,
  [BoundsType.Hard]: 2,
};

export const rewardSortOrder = {
  [RewardType.Low]: 0,
  [RewardType.Middle]: 1,
  [RewardType.High]: 2,
};

export const delaySortOrder = {
  [DelayType.Sync]: 0,
  [DelayType.NarrowAsync]: 1,
  [DelayType.WideAsync]: 2,
};
