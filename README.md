# Usb raw HID tester for Massdrop CTRL keyboard.

## Installation

1. init npm

    ```bash
    npm init
    ```

2. install typescript

    ```bash
    npm install --save typescript ts-node
    ```

3. install typescript type helpers

    ```bash
    npm install --save-dev @types/node
    ```

4. install nodehid and typescript types

    ```bash
    npm install --save node-hid @types/node-hid
    ```

Use [TypeSearch](https://microsoft.github.io/TypeSearch/) to check whether a module has associated
type info available to be installed.

There's also [HIDSharp](https://www.zer7.com/software/hidsharp) for accessing HID devices.

To make the massdrop CTRL (vendor id = 04d8) devices are user accessible copy
`50-massdrop-ctrl.rules` to `/etc/udev/rules.d` and reload the daemon:

```bash
sudo udevadm control --reload
sudo udevadm trigger
```

## Running

```bash
npm run rawhid
```
