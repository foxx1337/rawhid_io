#!/usr/bin/env node

import { HID, devices } from 'node-hid';

console.log('hey there!');

console.dir(HID);
console.log(devices());
