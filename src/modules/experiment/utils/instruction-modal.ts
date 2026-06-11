import { ExperimentState } from '../jspsych/experiment-state-class';
import {
  coreTaskInstructionPagesStimulus,
  validationVideo,
} from '../jspsych/stimulus';
import { INSTRUCTION_LABEL, SELECT_INSTRUCTION_TOPIC } from './constants';
import { InstructionIDs, Phase } from './types';

interface InstructionTopic {
  id: string;
  label: string;
  getPages: (state: ExperimentState) => string;
}

/**
 *
 * @returns Ensures that a modal overlay and content container exist in the DOM, creating them if necessary.
 */
export const ensureModal = (): {
  overlay: HTMLElement;
  content: HTMLElement;
} => {
  let overlay = document.querySelector('.modal-overlay') as HTMLElement;
  let content = document.querySelector('.modal-content') as HTMLElement;
  const jspsychDisplayElement = document.querySelector(
    '.jspsych-display-element',
  );

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    content = document.createElement('div');
    content.className = 'modal-content';

    const closeButton = document.createElement('span');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
      // eslint-disable-next-line no-return-assign
      overlay.style.display = 'none';
    });

    content.appendChild(closeButton);
    overlay.appendChild(content);
    if (!jspsychDisplayElement) document.body.appendChild(overlay);
    else jspsychDisplayElement.appendChild(overlay);
  }

  return { overlay, content };
};

const getCurrentInstructionTopics = (phase: Phase): InstructionTopic[] => {
  const currentTopics: InstructionTopic[] = [];
  if (phase !== 'introduction') {
    currentTopics.push({
      id: InstructionIDs.Tapping,
      label: INSTRUCTION_LABEL[InstructionIDs.Tapping],
      getPages: validationVideo,
    });
  }
  if (phase === 'EBDM') {
    currentTopics.push({
      id: InstructionIDs.EBDM,
      label: INSTRUCTION_LABEL[InstructionIDs.EBDM],
      getPages: coreTaskInstructionPagesStimulus,
    });
  }
  return currentTopics;
};

export const showInstructionsMenu = (state: ExperimentState): void => {
  const { overlay, content } = ensureModal();
  overlay.style.display = 'flex';

  const closeButton = content.querySelector('.close-button');
  content.innerHTML = '';
  if (closeButton) content.appendChild(closeButton);

  // Now safely add your new content
  const header = document.createElement('h2');
  header.textContent = SELECT_INSTRUCTION_TOPIC();
  content.appendChild(header);

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexWrap = 'wrap';
  buttonContainer.style.gap = '20px';
  buttonContainer.style.justifyContent = 'center';
  buttonContainer.style.marginTop = '20px';

  getCurrentInstructionTopics(state.getState().phase).forEach((topic) => {
    const btn = document.createElement('button');
    btn.textContent = topic.label;
    btn.className = 'jspsych-btn';
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    btn.onclick = () => showInstructionPages(topic, state);
    buttonContainer.appendChild(btn);
  });

  content.appendChild(buttonContainer);
};

const showInstructionPages = (
  topic: InstructionTopic,
  state: ExperimentState,
): void => {
  const { content } = ensureModal();
  const currentPages = topic.getPages(state);
  let currentPageIndex = 0;

  const renderPage = (): void => {
    const closeButton = content.querySelector('.close-button');
    content.innerHTML = '';
    if (closeButton) content.appendChild(closeButton);

    const pageHTML = currentPages[currentPageIndex];
    const pageContainer = document.createElement('div');
    pageContainer.innerHTML = pageHTML;
    pageContainer.style.width = '100%';

    const nav = document.createElement('div');
    nav.style.display = 'flex';
    nav.style.justifyContent = 'space-between';
    nav.style.marginTop = '20px';
    nav.style.width = '100%';

    // Back to Menu button
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back to Menu';
    backBtn.className = 'jspsych-btn';
    backBtn.onclick = () => showInstructionsMenu(state);

    // Prev/Next navigation
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPageIndex === 0;
    prevBtn.className = 'jspsych-btn';
    prevBtn.onclick = () => {
      if (currentPageIndex > 0) {
        currentPageIndex -= 1;
        renderPage();
      }
    };

    const nextBtn = document.createElement('button');
    nextBtn.textContent =
      currentPageIndex === currentPages.length - 1 ? 'Finish' : 'Next';
    nextBtn.className = 'jspsych-btn';
    nextBtn.onclick = () => {
      if (currentPageIndex < currentPages.length - 1) {
        currentPageIndex += 1;
        renderPage();
      } else {
        showInstructionsMenu(state);
      }
    };

    const navRight = document.createElement('div');
    navRight.style.display = 'flex';
    navRight.style.gap = '10px';
    navRight.appendChild(prevBtn);
    navRight.appendChild(nextBtn);

    nav.appendChild(backBtn);
    nav.appendChild(navRight);

    content.appendChild(pageContainer);
    content.appendChild(nav);
  };

  renderPage();
};

/**
 * function to add an instructions button that opens a modal with the instructions
 */
export const addInstructionsButton = (state: ExperimentState): void => {
  const progressBarContainer = document.getElementById(
    'jspsych-progressbar-container',
  );
  if (!progressBarContainer || document.querySelector('.instructions-button'))
    return;

  const instructionsButton = document.createElement('button');
  instructionsButton.textContent = 'Instructions';
  instructionsButton.className = 'jspsych-btn-progress-bar instructions-button';
  instructionsButton.style.marginLeft = '10px';
  instructionsButton.style.cursor = 'pointer';

  const { overlay } = ensureModal();

  instructionsButton.addEventListener('click', () => {
    overlay.style.display = 'flex';
    showInstructionsMenu(state);
  });

  progressBarContainer.appendChild(instructionsButton);
};

/**
 * Update the current instructions in the modal
 */
export const updateInstructions = (newHTML: string): void => {
  const { content } = ensureModal();

  // Remove everything except the close button
  const closeButton = content.querySelector('.close-button');
  content.innerHTML = '';
  if (closeButton) content.appendChild(closeButton);

  // Add the new content
  const instructionsDiv = document.createElement('div');
  instructionsDiv.innerHTML = newHTML;
  content.appendChild(instructionsDiv);
};
