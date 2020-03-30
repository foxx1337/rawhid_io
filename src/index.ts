#!/usr/bin/env node

import { HID, devices, setDriverType } from 'node-hid';
import * as readline from 'readline';

const vendorId = 0x04D8;
const productId = 0xEED2;
const usagePage = 0xFF60;
const usage = 0x61;

setDriverType('hidraw');

let deviceInfo = devices().find((dev) => {
    var isCtrl = dev.vendorId === vendorId && dev.productId === productId;
    if (isCtrl) {
        console.log(dev);
    }
    //return isCtrl && dev.usagePage === usagePage && dev.usage === usage;
    return dev.interface === 1;
});

let path: string;

if (deviceInfo) {
    path = deviceInfo.path;
} else {
    path = '/dev/hidraw7';
    console.log(`Can't detect the keyboard, defaulting to ${path}.`);
}

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

if (path) {
    console.log(`Detected Massdrop CTRL at ${path}.`);
    let ctrl = new HID(path);

    ctrl.on('data', (data) => {
        console.log('got data from the ctrl:');
        console.log(data);
    }).on('error', (err) => {
        console.log('got error from the ctrl:');
        console.log(err);
    });
    
    //say(ctrl, 1);

    setTimeout(() => {
        console.log('ping\n');
    }, 2000);

    consoleLoop(ctrl);
} else {
    console.log('Couldn\'t find CTRL.');
}

function consoleLoop(device) {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    console.log('Write exit to quit.');
    console.log('Other commands:');
    console.log('   hello - retrieves the initial identifier from the keyboard - "CTRL".');
    console.log('   lights - toggles the keyboard lights status (use an on-screen kb to enter).');
    console.log('   led N - makes the led at position N fully green.');
    console.log('   mode N - switches illumination mode to N.');
    rl.on('line', (line) => {
        switch (line) {
            case 'exit':
                exit(device);
            case 'hello':
                say(device, 1);
                break;
            case 'lights':
                say(device, 2);
                break;
            default: {
                const tokens = line.split(/\s+/);
                switch (tokens[0]) {
                    case 'led': {
                        const led = Number(tokens[1]);
                        say(device, 3, led);
                        break;
                    }
                    case 'mode': {
                        const mode = Number(tokens[1]);
                        say(device, 4, mode);
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
    device.close();
    console.log("Done. Exiting.")
    process.exit(0);
}
