import Keyboard, { type SimpleKeyboard } from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';

export type KeyboardType = SimpleKeyboard;

/**
 * @function createKeyboard
 * @description Creates and initializes a virtual keyboard using the `simple-keyboard` library, appending it to the display element for the tutorial trials.
 *
 * This function includes:
 * - Creating a container for the virtual keyboard and appending it to the specified `displayElement`.
 * - Initializing the `simple-keyboard` instance with custom configurations.
 * - Handling keyboard events such as key presses and shifts between different layouts (e.g., shift, caps lock).
 * - Synchronizing the virtual keyboard input with a corresponding HTML input element.
 *
 * @param {HTMLElement} displayElement - The DOM element to which the keyboard will be appended.
 *
 * @returns {Object} - An object containing the `keyboard` instance and `keyboardDiv` element.
 * - `keyboard`: The `simple-keyboard` instance, which allows further interactions with the keyboard.
 * - `keyboardDiv`: The DOM element that contains the virtual keyboard.
 */

// Discovered that there is a simple parameter called "physicalKeyboardHighlightPress: BOOLEAN" which can be set to true to not rework the wheel. Should be implemented for simplicity.
export function createKeyboard(displayElement: HTMLElement): {
  keyboard: Keyboard;
  keyboardDiv: HTMLDivElement;
} {
  const keyboardContainer = document.createElement('div');
  keyboardContainer.id = 'keyboard-container';
  keyboardContainer.style.position = 'fixed';
  keyboardContainer.style.bottom = '0';
  keyboardContainer.style.width = '75%';
  keyboardContainer.style.backgroundColor = '#fff';
  keyboardContainer.style.zIndex = '1000';
  displayElement.appendChild(keyboardContainer);

  const keyboardDiv = document.createElement('div');
  keyboardDiv.className = 'simple-keyboard';
  keyboardDiv.style.width = '100%';
  keyboardDiv.style.boxSizing = 'border-box';
  keyboardDiv.style.minHeight = '100px';
  keyboardDiv.style.backgroundColor = 'lightgray';
  keyboardContainer.appendChild(keyboardDiv);

  const handleShift = (keyboardPar: Keyboard): void => {
    const currentLayout = keyboardPar.options.layoutName;
    const shiftToggle = currentLayout === 'default' ? 'shift' : 'default';

    keyboardPar.setOptions({
      layoutName: shiftToggle,
    });
  };

  const keyboard = new Keyboard(keyboardDiv, {
    onChange: (input: string) => {
      (document.querySelector('.input') as HTMLInputElement).value = input;
    },
    onKeyPress: (button: string) => {
      if (button === '{shift}' || button === '{lock}') handleShift(keyboard);
    },
    physicalKeyboardHighlight: true,
    physicalKeyboardHighlightPress: true,
    physicalKeyboardHighlightBgColor: '#008000',
    theme: 'hg-theme-default hg-layout-default myTheme',
  });

  return { keyboard, keyboardDiv };
}
