#!/usr/bin/env node

import { HID, devices, setDriverType } from 'node-hid';
import * as readline from 'readline';

const vendorId = 0x04D8;
const productId = 0xEED2;
const usagePage = 0xFF60;
const usage = 0x61;

setDriverType('hidraw');

const deviceInfo = devices().find((dev) => {
    console.log(`${dev.path}; vendorId=${dev.vendorId}, productId=${dev.productId}, usagePage=${dev.usagePage}, usage=${dev.usage}.`);
    var isCtrl = dev.vendorId === vendorId && dev.productId === productId;
    return isCtrl && dev.usagePage === usagePage && dev.usage === usage;
});

if (deviceInfo) {
    console.log(`Detected Massdrop CTRL at ${deviceInfo.path}.`);
    let ctrl = new HID(deviceInfo.path);

    ctrl.on('data', (data) => {
        console.log('got data from the ctrl:');
        console.log(data);
    }).on('error', (err) => {
        console.log('got error from the ctrl:');
        console.log(err);
    });
    
    const bytesWritten = ctrl.write([0, 100]);
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
