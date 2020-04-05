#!/usr/bin/env node

import { HID, devices, setDriverType } from 'node-hid';
import * as readline from 'readline';

const vendorId = 0x04D8;
const productId = 0xEED2;
const usagePage = 0xFF60;
const usage = 0x61;

function say(device: HID, message: number, ...args: number[]) {
    const data = [];
    for (let i = 0; i < 64; i++) {
        data[i] = 0;
    }

    data[0] = message;

    for (let i = 0; i < args.length; i++) {
        data[1 + i] = args[i];
    }

    const bytesWritten = device.write(data);
    console.log(`Sent ${bytesWritten} bytes to the device.`);
}

function echo(device: HID) {
    const data = device.readSync();
    console.log('got', data);
}

function hexToRgbArray(input) {
    const shorthandRegex = /^(?:#|0x)?([a-f\d])([a-f\d])([a-f\d])$/i;
    const hex = input.replace(shorthandRegex, (match, r, g, b) => r + r + g + g + b + b);

    const result = /^(?:#|0x)?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

const commands: { [index: string]: any } = {
    hello: {
        ctrl_hid_code: 3,
        description: 'hello - Retrieves the initial identifier from the keyboard - "CTRLHID 1.0.0".'
    },
    lights: {
        ctrl_hid_code: 4,
        description: 'lights - Toggles the keyboard lights status (use an on-screen kb to enter).',
    },
    led: {
        ctrl_hid_code: 5,
        description: 'led N [color] - Colors the led at position N. Use "255 0 0" or "#FF0000" for red, default is green.'
    },
    leds: {
        ctrl_hid_code: 6,
        description: 'leds start [hex colors] - From the led at start, paint each following led with the given hex color.'
    },
    mode: {
        ctrl_hid_code: 7,
        description: 'mode N - Switches illumination to mode N.'
    }
};

function openCtrlHidDevice() {
    const candidateCtrlDevices = devices().filter(
        dev => dev.vendorId === vendorId && dev.productId === productId);
    
    // usage and usagePage only valid on Windows and OS X
    const hasUsage = process.platform === 'win32' || process.platform === 'darwin';

    const deviceInfo = candidateCtrlDevices.find(dev =>
        hasUsage
            ? dev.usage === usage && dev.usagePage === usagePage
            : dev.interface === 1);

    if (typeof deviceInfo !== 'undefined') {
        return new HID(deviceInfo.path);
    }

    return null;
}

const ctrl = openCtrlHidDevice();

if (typeof ctrl === 'undefined') {
    console.log('Failed to open CTRL. Exiting.');
    exit(ctrl);
}

ctrl.on('error', (err) => {
    console.log('Error from the CTRL:');
    console.log(err);
    console.log('Exiting.');
    exit(ctrl);
});
    
setTimeout(() => {
    console.log('ping\n');
}, 2000);

consoleLoop(ctrl);

function consoleLoop(device) {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('Write exit to quit.');
    console.log('Other commands:');
    for (let command in commands) {
        console.log(`   ${commands[command].description}`);
    }
    rl.on('line', (line) => {
        switch (line) {
            case 'exit':
                exit(device);
            case 'hello':
                say(device, commands.hello.ctrl_hid_code);
                echo(device);
                break;
            case 'lights':
                say(device, commands.lights.ctrl_hid_code);
                echo(device);
                break;
            default: {
                const tokens = line.split(/\s+/);
                switch (tokens[0]) {
                    case 'led': {
                        const led = Number(tokens[1]);
                        let colors: number[];
                        if (tokens.length === 5) {
                            colors = [Number(tokens[2]), Number(tokens[3]), Number(tokens[4])];
                        } else if (tokens.length === 3) {
                            colors = hexToRgbArray(tokens[2]);
                        } else {
                            colors = [0x00, 0xff, 0x00];
                        }
                        say(device, commands.led.ctrl_hid_code, led, ...colors);
                        echo(device);
                        break;
                    }
                    case 'leds': {
                        const led = Number(tokens[1]);
                        const nLeds = tokens.length - 2;
                        let colors = [];
                        for (let i = 0; i < nLeds; i++) {
                            colors = colors.concat(hexToRgbArray(tokens[2 + i]));
                        }
                        say(device, commands.leds.ctrl_hid_code, led, nLeds, ...colors)
                        echo(device);
                        break;
                    }
                    case 'mode': {
                        const mode = Number(tokens[1]);
                        say(device, commands.mode.ctrl_hid_code, mode);
                        echo(device);
                        break;
                    }
                }
            }
        }
    }).on('close', () => {
        exit(device);
    });   
}

function exit(device) {
    if (typeof device !== 'undefined') {
        device.close();
    }

    console.log("Done. Exiting.")
    process.exit(0);
}
