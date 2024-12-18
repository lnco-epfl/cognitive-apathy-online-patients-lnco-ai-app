import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import { DataCollection, JsPsych } from 'jspsych';

import { Trial } from '../utils/types';

export type DeviceType = {
  device: SerialPort | null;
  sendTriggerFunction: (
    device: SerialPort | null,
    trigger: number,
  ) => Promise<void>;
};
export type ConnectType = 'Serial Port' | 'USB' | null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SerialPort = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type USBDevice = any;

/**
 * @function connectToSerial
 * @description Prompts the user to select a serial port and then opens it with specified settings.
 * @returns {Promise<SerialPort | null>} - A Promise that resolves to the connected SerialPort object or null if the connection fails.
 */
export async function connectToSerial(): Promise<SerialPort | null> {
  try {
    // Request a serial port from the user
    // @ts-ignore
    const port: SerialPort = await navigator.serial.requestPort();

    // Open the serial port with desired settings
    await port.open({ baudRate: 9600 }); // Adjust baudRate as needed

    // eslint-disable-next-line no-console
    return port;
  } catch (error) {
    console.error('Serial Port Connection Error:', error);
    return null;
  }
}

/**
 * @function sendTriggerToSerial
 * @description Sends a trigger string to the connected serial port.
 * @param {SerialPort | null} device - The connected serial port device.
 * @param {string} trigger - The trigger string to send.
 * @returns {Promise<void>} - A Promise that resolves when the trigger has been sent.
 */
export async function sendTrigger(
  device: SerialPort | null,
  trigger: number,
): Promise<void> {
  try {
    if (device) {
      const writer = device.device.writable!.getWriter();
      const buffer = new Uint8Array([trigger]);
      await writer.write(buffer);

      // eslint-disable-next-line no-console
      writer.releaseLock();
    } else {
      // eslint-disable-next-line no-console
      console.log(`No device connected. Tried to send ${trigger}`);
    }
  } catch (error) {
    console.error('Failed to send trigger:', error);
  }
}

/**
 * @function deviceConnectPages
 * @description Creates a timeline to guide the user through the process of connecting a USB or Serial device, with options for handling connection errors and retries. The timeline consists of a page that provides instructions for connecting the device and allows the user to attempt the connection, retry if it fails, or skip the connection process entirely.
 *
 * The function handles:
 * - Displaying connection instructions based on the specified connection type (USB or Serial).
 * - Providing a button to initiate the connection attempt.
 * - Handling connection failures by allowing the user to retry the connection or skip it.
 * - Updating the `deviceInfo` object with the connected device and the appropriate trigger function based on the connection type.
 *
 * @param {JsPsych} jsPsych - The jsPsych instance used to manage the experiment timeline.
 * @param {{ device: SerialPort | USBDevice | null, sendTriggerFunction: (device: SerialPort | USBDevice | null, trigger: string) => Promise<void> }} deviceInfo - An object that holds the connected device, which can be either `SerialPort` or `USBDevice`, or `null`, and a function to send triggers to the device.
 * @param {'Serial Port' | 'USB'} connectType - The type of connection being established, either 'Serial Port' or 'USB'.
 *
 * @returns {timeline} - The timeline configuration object for managing the device connection process, including error handling and retry options.
 */
export const deviceConnectPages = (
  jsPsych: JsPsych,
  deviceInfo: DeviceType,
  forceDevice: boolean,
): Trial => {
  const connectFunction: () => Promise<SerialPort> = connectToSerial;
  return {
    timeline: [
      {
        timeline: [
          {
            type: HtmlButtonResponsePlugin,
            stimulus: `Connect a device<br>`,
            choices: [
              'Connect Device',
              ...(!forceDevice ? ['Skip Connect'] : []),
            ],
            on_load: (): void => {
              // Add event listener to the connect button
              document
                .getElementsByClassName('jspsych-btn')[0]
                .addEventListener('click', async () => {
                  // eslint-disable-next-line no-param-reassign
                  deviceInfo.device = await connectFunction();
                  if (deviceInfo.device !== null) {
                    // eslint-disable-next-line no-param-reassign
                    deviceInfo.sendTriggerFunction = sendTrigger;
                    jsPsych.finishTrial();
                  }
                  document.getElementsByClassName('jspsych-btn')[0].innerHTML =
                    'Retry';
                  document.getElementById(
                    'jspsych-html-button-response-stimulus',
                  )!.innerHTML +=
                    `<br><small style="color: red;">Connection Failed</small>`;
                });
            },
            on_finish() {
              // Add an event listener to the Send button
              deviceInfo.sendTriggerFunction(deviceInfo, 0);
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 1),
                250,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 2),
                500,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 4),
                750,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 8),
                1000,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 16),
                1250,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 32),
                1500,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 64),
                1750,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 128),
                2000,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 255),
                2250,
              );
              setTimeout(
                () => deviceInfo.sendTriggerFunction(deviceInfo, 0),
                2500,
              );
            },
          },
        ],
        loop_function(data: DataCollection): boolean {
          // Repeat the connection step if the user chooses to retry
          return data.last(1).values()[0].response === 0;
        },
      },
      {
        timeline: [
          {
            type: HtmlKeyboardResponsePlugin,
            stimulus: `
          <div>
            <p>Please enter a number between 0 and 255:</p>
            <input type="number" id="byteInput" min="0" max="255" />
            <button id="sendButton">Send</button>
            <p id="errorMessage" style="color: red;"></p>
          </div>
        `,
            choices: [],
            on_load: () => {
              document
                .getElementById('sendButton')!
                .addEventListener('click', async () => {
                  const inputElement = document.getElementById(
                    'byteInput',
                  ) as HTMLInputElement;
                  const value = Number(inputElement.value);

                  // Validate the input
                  if (value >= 0 && value <= 255) {
                    // Send the number as a raw byte (Uint8Array)
                    deviceInfo.sendTriggerFunction(deviceInfo, value);
                    setTimeout(
                      () => deviceInfo.sendTriggerFunction(deviceInfo, 0),
                      1000,
                    );
                    // Finish the trial after sending the byte
                    jsPsych.finishTrial();
                  } else {
                    // Show an error message if the value is not valid
                    document.getElementById('errorMessage')!.textContent =
                      'Please enter a number between 0 and 255.';
                  }
                });
            },
          },
        ],
        // Conditional trial section should only occur if the corresponding calibration part failed due to minimum taps previously
        conditional_function() {
          return deviceInfo.device !== null;
        },
        repetitions: 1,
      },
    ],
  };
};
