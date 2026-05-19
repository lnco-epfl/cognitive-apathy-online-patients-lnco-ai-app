import {
  AGENCY_TAPPING_CORE_BLOCK_INSTRUCTIONS_MESSAGE,
  AGENCY_TAPPING_HEADER,
  AGENCY_TAPPING_INSTRUCTIONS_PAGES,
  BAR_MESSAGE,
  CALIBRATION_HEADER,
  CALIBRATION_PART_2_DIRECTIONS,
  CLICK_BUTTON_TO_PROCEED_MESSAGE,
  CONTINUE_MESSAGE_DIRECTION,
  CONTINUE_MESSAGE_TITLE,
  CORE_TAPPING_HEADER,
  CORE_TAPPING_INSTRUCTIONS_PAGES,
  EXPERIMENT_SETUP_HEADER,
  GO_MESSAGE,
  HIGH_EFFORT_MESSAGE,
  INSTRUCTIONS_SUB_HEADER,
  INTRODUCTION_HEADER,
  LOADING_BAR_MESSAGE,
  LOST_CONNECTION_WARNING_MESSAGE,
  LOW_EFFORT_MESSAGE,
  PHASE_5_INSTRUCTION,
  PRACTICE_MESSAGE,
  REMEMBER_PAGE_DIRECTIONS,
  REMEMBER_PAGE_TITLE,
  REWARD_TRIAL_MESSAGE,
  SIT_COMFORTABLY_MESSAGE,
  STAY_IN_TARGET_MESSAGE,
  TAPPING_INSTRUCTIONS_PAGES,
  TARGET_AREA_MESSAGE,
  TRY_AGAIN_BUTTON,
  TUTORIAL_HEADER_1,
  TUTORIAL_HEADER_2,
  TUTORIAL_INTRODUCTION_MESSAGE,
  VALIDATION_PRACTICE_HEADER,
  VALIDATION_VIDEO_TUTORIAL_MESSAGE,
  WRAP_UP_HEADER,
  imagePathInstructions,
} from '../utils/constants';
import { CalibrationPartType, ExtendedKeySettings } from '../utils/types';
import { ExperimentState } from './experiment-state-class';

export function stimulus(
  showThermometer: boolean,
  mercuryHeight: number,
  trialType: string,
  lowerBound: number,
  upperBound: number,
  targetArea: boolean,
  keyToPress: string,
  keysToHold: string[],
  startPromptMessage?: string,
): string {
  const bounds = `
  <div
    id="target-area"
    style="position: absolute; bottom: ${lowerBound}%; width: 100%; height: ${upperBound - lowerBound}%; background-color: #0000ff; z-index:2"
  >
  </div>
  <div
    id="lower-bound"
    style="position: absolute; bottom: ${lowerBound}%; width: 100%; height: 2px; background-color: black; z-index:4"
  ></div>
  <div
    id="upper-bound"
    style="position: absolute; bottom: ${upperBound}%; width: 100%; height: 2px; background-color: black; z-index:4"
  ></div>
`;

  const targetAreaText = targetArea
    ? `
  <div style="position: absolute; left: 110px; bottom: ${lowerBound + (upperBound - lowerBound) / 2}%; transform: translateY(50%); width:100px;">
    <b>${TARGET_AREA_MESSAGE()}</b>
  </div>`
    : ``;

  let extraText = '';

  if (trialType === 'practice') {
    extraText = `
        <div id="status" style="margin-top: 50px; position:absolute; top:20%;">
          <div id="start-message-element" style="color: black;">${startPromptMessage ?? PRACTICE_MESSAGE(keyToPress, keysToHold)}</div>
        </div>`;
  } else if (
    trialType === CalibrationPartType.CalibrationPart1 ||
    trialType === CalibrationPartType.FinalCalibrationPart1
  ) {
    extraText = `
        <div id="status" style="margin-top: 50px; position:absolute; top:20%;">
          <div id="start-message" style="color: green;">${PRACTICE_MESSAGE(keyToPress, keysToHold)}</div>
        </div>`;
  }

  let thermometer = `<div id="no_stimuli_calibration" style="position: relative; display: flex; justify-content: center; align-items: center; height: 300px; width: 100px;">
       <p class="fs-result" style="position: absolute;">+</p>
     </div>`;

  if (showThermometer) {
    thermometer = `<div
      id="thermometer-container"
      style="display: flex; justify-content: center; align-items: center; height: 300px; width: 100px; border: 1px solid #000;"
    >
      <div
        id="thermometer"
        style="position: relative; width: 100%; height: 100%; background-color: #e0e0e0;"
      >
        <div
          id="mercury"
          style="height: ${mercuryHeight}%; background-color: red; z-index:3"
        ></div>
        ${bounds}
      </div>
    </div>`;
  } else if (trialType === 'practice') {
    thermometer =
      '<div id="no_stimuli_practice" style="position: relative; height: 300px; width: 100px;"></div>';
  }
  return `
      <div id="go-message" class="fs-go" style="position: absolute; top:8%; color: green; visibility: hidden; transform: translateX(-50%); left: 50%; white-space: nowrap;">${GO_MESSAGE()}</div>
      <div id="task-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; padding: 60px 200px;">
        ${extraText}
        <div style="display: flex; align-items: center; position: relative;">
          ${targetAreaText}
          ${thermometer}
        </div>
      </div>
   `;
}

export function agencyTaskStimulus(
  showThermometer: boolean,
  mercuryHeight: number,
  lowerBound: number,
  upperBound: number,
  targetArea: boolean,
): string {
  const bounds = `
  <div
    id="target-area"
    style="position: absolute; bottom: ${lowerBound}%; width: 100%; height: ${upperBound - lowerBound}%; background-color: #0000ff; z-index:2"
  >
  </div>
  <div
    id="lower-bound"
    style="position: absolute; bottom: ${lowerBound}%; width: 100%; height: 2px; background-color: black; z-index:4"
  ></div>
  <div
    id="upper-bound"
    style="position: absolute; bottom: ${upperBound}%; width: 100%; height: 2px; background-color: black; z-index:4"
  ></div>
  `;

  const targetAreaText = targetArea
    ? `
    <div style="position: absolute; left: 110px; bottom: ${lowerBound + (upperBound - lowerBound) / 2}%; transform: translateY(50%); width:100px;">
      <b>${TARGET_AREA_MESSAGE()}</b>
    </div>`
    : ``;

  const keepInBoundsMessage = `
    <div id="keep-in-bounds-message" 
      style="text-align: center; font-size: 1.5em; color: black; visibility: hidden">
      ${BAR_MESSAGE()}
    </div> 
  `;

  const inBoundsTimer = `
  <div id="in-bounds-timer"
     style="text-align: center; font-size: 1.5em; color: black; visibility: hidden;">
     <p>${STAY_IN_TARGET_MESSAGE()} <span id="clock"></span></p>

  </div>
  `;

  const thermometer = showThermometer
    ? `<div
      id="thermometer-container"
      style="display: flex; justify-content: center; align-items: center; height: 300px; width: 100px; border: 1px solid #000;"
    >
      <div
        id="thermometer"
        style="position: relative; width: 100%; height: 100%; background-color: #e0e0e0;"
      >
        <div
          id="mercury"
          style="
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: ${mercuryHeight}%;
            background-color: red;
            z-index: 3;
          "
        ></div>
        ${bounds}
      </div>
    </div>`
    : `<div id="no_stimuli_calibration" style="position: relative; display: flex; justify-content: center; align-items: center; height: 300px; width: 100px;">
       <p class="fs-result" style="position: absolute;">+</p>
     </div>`;

  return `
      <div id="freeze-frame"></div>
      <div id="go-message" class="fs-go" style="position: absolute; top: 10%; color: green; visibility: hidden; transform: translateX(-50%); left: 50%; white-space: nowrap;">
        ${GO_MESSAGE()}
      </div>
      <div id="task-container" 
        style="display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          height: 100%;
          width: 100%; 
          position: relative; 
          padding: 0 200px;
        ">
          <div id="message-container" style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            min-height: 150px;
            margin-bottom: 20px;
          ">

            ${keepInBoundsMessage}  
            ${inBoundsTimer}
          </div>
          <div style="display: flex; align-items: center; position: relative;">
              ${targetAreaText}
              ${thermometer}
          </div>
      </div>
   `;
}

export const acceptanceThermometer = (
  bounds: number[],
  reward: number,
): string => `
<div
  id="acceptance-container"
  style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;"
>
  <div style="display: flex; flex-direction: row; align-items: center; gap: 12px;">
    <div
      id="thermometer-container"
      style="height: 300px; width: 100px; border: 2px solid #000; box-sizing: border-box; flex-shrink: 0;"
    >
      <div
        id="thermometer"
        style="position: relative; width: 100%; height: 100%; background-color: #e0e0e0; box-sizing: border-box;"
      >
        <div
          id="blue-area"
          style="position: absolute; bottom: ${bounds[0]}%; height: ${bounds[1] - bounds[0]}%; width: 100%; background-color: blue;"
        ></div>
        <div
          id="lower-bound"
          style="position: absolute; bottom: ${bounds[0]}%; width: 100%; height: 2px; background-color: black;"
        ></div>
        <div
          id="upper-bound"
          style="position: absolute; bottom: ${bounds[1]}%; width: 100%; height: 2px; background-color: black;"
        ></div>
      </div>
    </div>
    <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; height: 300px;">
      <!-- Arrow -->
      <div style="display: flex; flex-direction: column; align-items: center; height: 100%;">
        <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 20px solid black;"></div>
        <div style="flex: 1; width: 6px; background-color: black;"></div>
        <div style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-top: 20px solid black;"></div>
      </div>
      <!-- Labels -->
      <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
        <span>${HIGH_EFFORT_MESSAGE()}</span>
        <span>${LOW_EFFORT_MESSAGE()}</span>
      </div>
    </div>
  </div>
  <p style="text-align: center; margin-top: 30px; font-weight: bold;">${REWARD_TRIAL_MESSAGE(reward.toFixed(0))}</p>
</div>
`;

export const loadingBar = (): string => `
  <div class="loading-bar-container">
    <h1>${LOADING_BAR_MESSAGE()}</h1>
    <br>
    <div class="bar">
      <div class="progress"></div>
    </div>
    <div class="percentage">0</div>
    <link rel="stylesheet" type="text/css" href="import '../styles/main.scss';">
  </div>
`;

/**
 *
 * @param keySettings current key settings
 * @returns array of instruction pages to be displayed in the tapping instructions timeline, each page has text left and image right
 */

/**
 *
 * @param keySettings current key settings
 * @returns array of instruction pages to be displayed in the tapping instructions timeline, each page has text left and image right
 */
export const tappingInstructionPagesStimulus = (
  state: ExperimentState,
): string[] => {
  const rawPages = TAPPING_INSTRUCTIONS_PAGES(state.getKeySettings()) as
    | string
    | string[];
  const page = Array.isArray(rawPages) ? (rawPages[0] ?? '') : rawPages;

  return [
    `
    <div class="instruction-container" >
      <h1>${TUTORIAL_HEADER_2()}</h1>
      <div class="instruction-content">
        <div class="instruction-text">
          <p style="color: #333; max-width: 90%; margin: 0 auto; line-height: 1.5; text-align: left;">
            ${page}
          </p>
        </div>
        <img src="./assets/images/hand-${state.getPreferredHand() === 'left' ? 'l' : 'r'}-3-${state.getSettings().languageSettings.language}.png" alt="Dual-key instruction" class="instruction-image" />
      </div>
    </div>
  `,
  ];
};

/**
 *
 * @param keySettings current key settings
 * @returns array of instruction pages to be displayed in the tapping instructions timeline, each page has text left and image right
 */

// TODO: Proper setup will be: Page 0: No video; Page 1: Tapping video; Page 2: Question video (or image)
// TODO: Fix widths
export const agencyTappingInstructionPagesStimulus = (
  state: ExperimentState,
): string[] =>
  AGENCY_TAPPING_INSTRUCTIONS_PAGES(state.getKeySettings()).map(
    (page, index) => `
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 20px;">
      <h2>${AGENCY_TAPPING_HEADER()}</h2>
      <div style="flex-grow: 1; display: flex; justify-content: center; align-items: center; margin: 0 auto;">
        <div style="flex-direction: column; display:flex; min-width:600px;">
          <p style="color: #333; width: 100%; margin: 0 auto; line-height: 1.5; text-align: left;">
            ${page}
          </p>
        </div>
        ${
          index === 0
            ? ''
            : `
              <div style="width: 70%; max-width: 500px; height: auto; background-color: rgb(255, 255, 255);">
                <img src="./assets/images/tapping-instructions${index}.png" alt="Tapping Instructions" style="width: 100%; height: auto;" />
              </div>
              `
        }
      </div>
      <div style="text-align: center; margin-top: 5%;">
        <p style="color: #333; margin: 0 auto; line-height: 1.5;">
          ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
        </p>
      </div>
    </div>
  `,
  );

/**
 *
 * @param keySettings
 * @returns an array of pages to go through for the core tapping task instructions
 */
export const coreTaskInstructionPagesStimulus = (
  state: ExperimentState,
): string[] => [
  `<div class="instruction-container" >
      <h2>${CORE_TAPPING_HEADER()}</h2>
      <h3>${INSTRUCTIONS_SUB_HEADER()}</h3>
      ${CORE_TAPPING_INSTRUCTIONS_PAGES(state)
        .map(
          (page, index) => `
        <div class="instruction-content" style="width: 80%;">
          <div class="instruction-text">
            <p>${page}</p>
          </div>
          <img src="${imagePathInstructions(index, state)}" alt="Offer Instructions" class="instruction-image" style="max-width:400px; max-height:300px;" />
        </div>
    `,
        )
        .join('<hr style="width:100%; border:1px solid #ccc;">')}      
      <div style="text-align: center; margin-top: 5%;">
        <p style="color: #333; margin: 0 auto; line-height: 1.5;">
          ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
        </p>
      </div>
    </div>`,
];

export const sitComfortablyStimuli = (): string => `
<h2>${INTRODUCTION_HEADER()}</h2>
<p1>${SIT_COMFORTABLY_MESSAGE()}</p1>
<img src="./assets/images/tip.png" alt="Description of the image" style="width:800px;height:auto; display:block; margin: 10px auto;">
<div style="text-align: center; margin-top: 0%;">
    <p style="color: #333; max-width: 80%; margin: 0 auto; line-height: 1.5;">
      ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
    </p>
</div>
`;

export const tutorialIntroductionStimuli = (): string => `
<h2>${EXPERIMENT_SETUP_HEADER()}</h2>
<p>${TUTORIAL_INTRODUCTION_MESSAGE()}</p>
<div style="text-align: center; margin-top: 0%;">
    <p style="color: #333; max-width: 80%; margin: 0 auto; line-height: 1.5;">
      ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
    </p>
</div>
`;

export const holdKeyInstructionStimuli = (state: ExperimentState): string => `
<div class="instruction-container" >
  <h2>${TUTORIAL_HEADER_1()}</h2>
    <div class="instruction-content">
      <div class="instruction-text">
        <p>${PHASE_5_INSTRUCTION(state.getKeySettings())}</p>
      </div>
      <img src="./assets/images/hand-${state.getPreferredHand() === 'left' ? 'l' : 'r'}-1-${state.getSettings().languageSettings.language}.png" alt="Keyboard instruction" class="instruction-image" />
    </div>
</div>
`;

export const calibrationPart2Stimuli = (
  keySettings: ExtendedKeySettings,
): string => `
  <div class="instruction-container" >
    <h2>${CALIBRATION_HEADER()}</h2>
    <div class="instruction-content">
      <div class="instruction-text">
        <p>${CALIBRATION_PART_2_DIRECTIONS(keySettings)}</p>
      </div>
      <img src="./assets/images/calibration.png" alt="Calibration instructions" class="instruction-image" style="max-width: 120px;" />
    </div>
    <div style="text-align: center; margin-top: 5%;">
      <p style="color: #333; margin: 0 auto; line-height: 1.5;">
        ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
      </p>
    </div>
  </div>
`;

export const finalCalibrationPart2Stimuli = (
  keySettings: ExtendedKeySettings,
): string => `
  <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 20px;">
    <h2>${WRAP_UP_HEADER()}</h2>
    <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; margin: 20px auto; gap:40px;">
      <div style="max-width: 700px; text-align: left; margin: 0 auto;">
        ${CALIBRATION_PART_2_DIRECTIONS(keySettings)}
      </div>
      <img src="./assets/images/calibration.png" alt="Calibration instructions" style="width: 100%; max-width: 100px; height: auto; margin: 20px auto;">
    </div>
    <div style="text-align: center; margin-top: 5%;">
      <p style="color: #333; margin: 0 auto; line-height: 1.5;">
        ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
      </p>
    </div>
  </div>
`;

export const validationVideo = (state: ExperimentState): string => `
  <div class="instruction-container" >
    <h2>${VALIDATION_PRACTICE_HEADER()}</h2>
    <div class="instruction-content" >
      <div class="instruction-text" >
        <p>${VALIDATION_VIDEO_TUTORIAL_MESSAGE(state.getKeySettings())}</p>
      </div>
      <img src="./assets/images/target-area-${state.getSettings().languageSettings.language}.png" alt="Target Area Image" class="instruction-image" />
    </div>
    <div style="text-align: center; margin-top: 0%;">
      <p>
        ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
      </p>
    </div>
  </div>`;

export const agencyTaskCoreBlockInstructionsStimuli = (
  breakFrequency: number,
): string => `
  <h2>${AGENCY_TAPPING_HEADER()}</h2>
  <p>${AGENCY_TAPPING_CORE_BLOCK_INSTRUCTIONS_MESSAGE(breakFrequency)}</p>
  <div style="text-align: center; margin-top: 0%;">
      <p style="color: #333; max-width: 80%; margin: 0 auto; line-height: 1.5;">
        ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
      </p>
  </div>
`;

export const continueMessageDirectionContent = (): string => `
<div style="text-align: center; margin: 0 10%;">
  <h2>${CONTINUE_MESSAGE_TITLE()}</h2>
  <p>
    ${CONTINUE_MESSAGE_DIRECTION()}
  </p>
  <p style="color: #333; max-width: 80%; margin: 0 auto; line-height: 1.5;">
    ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
  </p>
</div>
`;

export const rememberDirectionContent = (state: ExperimentState): string => `
  <div class="instruction-container" >
    <h2>${REMEMBER_PAGE_TITLE()}</h2>
    <div class="instruction-content" >
      <div class="instruction-text" >
        <p>${REMEMBER_PAGE_DIRECTIONS(state)}</p>      
      </div>
      <img src="./assets/images/two-offer-view.png" alt="Target Area Image" class="instruction-image" />
    </div>
    <div style="text-align: center; margin-top: 0%;">
      <p>
        ${CLICK_BUTTON_TO_PROCEED_MESSAGE()}
      </p>
    </div>
  </div>`;

export const renderConnectionWarning = (state: ExperimentState): string => {
  const patchStatus = state.getPatchStatus();

  if (patchStatus === 'pending') {
    return `<div style="margin-top:10px;color:gray;"><em>Checking connection...</em></div>`;
  }

  if (patchStatus === 'failed') {
    return `
      <div style="border: 2px solid red; border-radius:10px; padding: 5px; margin-top:10px; background-color:#ffe6e6; max-width:600px; text-align:center;">
        <p>${LOST_CONNECTION_WARNING_MESSAGE()}</p>
        <button class="jspsych-btn" style="background-color:red;color:white; margin: 0 auto;">
          ${TRY_AGAIN_BUTTON()}
        </button>
      </div>
    `;
  }

  return ''; // success → no warning
};
