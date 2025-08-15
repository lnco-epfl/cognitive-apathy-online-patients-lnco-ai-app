import { BoundsType, DelayType, RewardType } from '../experiment/utils/types';

export const boundsSortOrder = {
  [BoundsType.Easy]: 0,
  [BoundsType.EasyMedium]: 1,
  [BoundsType.Medium]: 2,
  [BoundsType.MediumHard]: 3,
  [BoundsType.Hard]: 4,
};

export const rewardSortOrder = {
  [RewardType.Low]: 0,
  [RewardType.LowMiddle]: 1,
  [RewardType.Middle]: 2,
  [RewardType.MiddleHigh]: 3,
  [RewardType.High]: 4,
};

export const delaySortOrder = {
  [DelayType.Sync]: 0,
  [DelayType.NarrowAsync]: 1,
  [DelayType.WideAsync]: 2,
};
