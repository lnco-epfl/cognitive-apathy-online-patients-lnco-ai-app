export type ScreenCalibration = {
  fontSize?: 'small' | 'normal' | 'large' | 'extra-large';
  scale?: number;
  participantId?: string;
  participantCode?: string;
};

const VALID_FONT_SIZES: ReadonlyArray<ScreenCalibration['fontSize']> = [
  'small',
  'normal',
  'large',
  'extra-large',
];

const isValidParticipantField = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

export function parseScreenCalibration(
  raw: unknown,
): ScreenCalibration | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const calibration = raw as {
    fontSize?: unknown;
    scale?: unknown;
    participantId?: unknown;
    participantCode?: unknown;
  };

  const result: ScreenCalibration = {};

  if (
    calibration.fontSize !== undefined &&
    VALID_FONT_SIZES.includes(
      calibration.fontSize as ScreenCalibration['fontSize'],
    )
  ) {
    result.fontSize = calibration.fontSize as ScreenCalibration['fontSize'];
  }

  if (
    typeof calibration.scale === 'number' &&
    calibration.scale > 0.5 &&
    calibration.scale < 3
  ) {
    result.scale = calibration.scale;
  }

  if (isValidParticipantField(calibration.participantId)) {
    result.participantId = calibration.participantId;
  }

  if (isValidParticipantField(calibration.participantCode)) {
    result.participantCode = calibration.participantCode;
  }

  return result.fontSize !== undefined ||
    result.scale !== undefined ||
    result.participantId !== undefined ||
    result.participantCode !== undefined
    ? result
    : undefined;
}
