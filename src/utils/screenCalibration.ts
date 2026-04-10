import { ScreenCalibration } from '@graasp/sdk';

const VALID_FONT_SIZES: ReadonlyArray<ScreenCalibration['fontSize']> = [
  'small',
  'normal',
  'large',
  'extra-large',
];

/**
 * Parses and validates a raw ScreenCalibration value from localContext.
 * Returns undefined if neither fontSize nor scale is valid.
 */
export function parseScreenCalibration(
  raw: ScreenCalibration | undefined,
): ScreenCalibration | undefined {
  if (!raw) return undefined;

  const result: ScreenCalibration = {};

  if (raw.fontSize !== undefined && VALID_FONT_SIZES.includes(raw.fontSize)) {
    result.fontSize = raw.fontSize;
  }

  if (typeof raw.scale === 'number' && raw.scale > 0.5 && raw.scale < 3) {
    result.scale = raw.scale;
  }

  return result.fontSize !== undefined || result.scale !== undefined
    ? result
    : undefined;
}
