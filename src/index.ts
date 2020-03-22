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
    path = '/dev/hidraw8';
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
    
    const data: number[] = [];
    for (let i = 0; i < 64; i++) {
        data[i] = i;
    }
    data[0] = 1;
    const bytesWritten = ctrl.write(data);
    console.log(`sent ${bytesWritten} bytes to the ctrl`);

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
    
    console.log("Write exit to quit.");
    rl.on('line', (line) => {
        console.log(`You entered: ${line}`);
    
        if (line === 'exit') {
            exit(device);
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
