#!/usr/bin/env node

import { HID, devices, setDriverType } from 'node-hid';
import * as readline from 'readline';

const vendorId = 0x04D8;
const productId = 0xEED2;
const usagePage = 0xFF60;
const usage = 0x61;

setDriverType('hidraw');

let deviceInfo = devices().find((dev) => {
    console.log(dev);
    var isCtrl = dev.vendorId === vendorId && dev.productId === productId;
    return isCtrl && dev.usagePage === usagePage && dev.usage === usage;
});

let path: string;

if (deviceInfo) {
    path = deviceInfo.path;
} else {
    path = '/dev/hidraw7';
}

function say(device: HID, message: number) {
    const data = [];
    for (let i = 0; i < 64; i++) {
        data[i] = 0;
    }

    data[0] = message;
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
    
    say(ctrl, 1);

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
    rl.on('line', (line) => {
        console.log(`You entered: ${line}`);
    
        if (line === 'exit') {
            exit(device);
        } else if (line === 'hello') {
            say(device, 1);
        } else if (line === 'lights') {
            say(device, 2);
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
