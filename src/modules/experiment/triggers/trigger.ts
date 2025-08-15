import { BoundsType, RewardType } from '../utils/types';
import { DeviceType } from './serialport';

export type ParallelPortMessageType = {
  outsideTask: boolean;
  decisionTrigger: boolean;
  delayedCondition?: boolean;
  reward?: RewardType;
  bounds?: BoundsType;
  isEnd: boolean;
};

/**
 * Pin Assignment for Parallel Port:
 * 1. Task Block (0) vs. Other (practice, calibration, validation etc.) (1)
 * 2. Task (0) vs. Decision (1)
 * 3. Condition Normal (0) vs Delay (1)
 * 4+5 Reward: Low (01) vs. Medium (10) vs. High (11)
 * 6+7 Effort: Low (01) vs. Medium (10) vs. High (11)
 * 8. Start (0) vs. End (1)
 * @param device
 * @param startEnd
 * @returns
 */
export const sendSerialTrigger = (
  device: DeviceType,
  messageInput: ParallelPortMessageType,
): void => {
  let message = 0;
  if (messageInput.outsideTask) {
    message += 128;
  }
  if (messageInput.decisionTrigger) {
    message += 64;
  }
  if (messageInput.delayedCondition) {
    message += 32;
  }
  switch (messageInput.reward) {
    case RewardType.Low:
      message += 8;
      break;
    case RewardType.Middle:
      message += 16;
      break;
    case RewardType.High:
      message += 24;
      break;
    default:
      message += 0;
      break;
  }
  switch (messageInput.bounds) {
    case BoundsType.Easy:
      message += 2;
      break;
    case BoundsType.Medium:
      message += 4;
      break;
    case BoundsType.Hard:
      message += 6;
      break;
    default:
      message += 0;
      break;
  }
  if (messageInput.isEnd) {
    message += 1;
  }
  device.sendTriggerFunction(device, message);
  setTimeout(() => {
    device.sendTriggerFunction(device, 0);
  }, 100);
};

export const sendPhotoDiodeTrigger = (
  photoDiodeSetting: 'top-left' | 'top-right' | 'customize' | 'off',
  isEnd: boolean,
): void => {
  const photoDiodeElement = document.getElementById('photo-diode-element');
  if (photoDiodeElement) {
    photoDiodeElement.className = `photo-diode photo-diode-white ${photoDiodeSetting}`;
  }
  setTimeout(() => {
    if (photoDiodeElement) {
      photoDiodeElement.className = `photo-diode photo-diode-black ${photoDiodeSetting}`;
    }
  }, 100);
  if (isEnd) {
    setTimeout(() => {
      if (photoDiodeElement) {
        photoDiodeElement.className = `photo-diode photo-diode-white ${photoDiodeSetting}`;
      }
    }, 200);
    setTimeout(() => {
      if (photoDiodeElement) {
        photoDiodeElement.className = `photo-diode photo-diode-black ${photoDiodeSetting}`;
      }
    }, 300);
  }
};
