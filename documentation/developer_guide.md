# the developer's guide to the app

please read user guide first.

## what is this app?
its an electron framework for a React application that basically reads and writes values to and from a serial port. It then parses the data, makes it pretty, maybe does math on it, and then displays and records it.

## how do i begin to develop this app?
1. clone this repo
2. install node and npm
3. run "npm install"
4. run "npm run dev" to run
5. run "npm run package" to make an executable

## app organization

basically, the important ones are:
### src
with all the source files 

- assets/examples
    - has examples 
- components
    - has all the individual components, including topbar editor, and all the widgets and their css files
    - components/parsers
        - includes files for the component parsers. written by hand mostly.
### .github
stores the .github configuration file. it includes a workflow the builds the app for Ubuntu, MacOS, and Windows on github when a release is published.

## can vs csv
this app can read 2 different kinds of data from serial: 

crtd: 
```crtd
timestamp.timestamp cantype id data data data data
2172.562 R29 0000052C 00 00 FF FF FF FF FF FF
2172.606 R29 0000052C 00 00 FF FF FF FF FF FF
2172.652 R29 0000052C 00 00 FF FF FF FF FF FF
2172.692 R29 0000052C 00 00 FF FF FF FF FF FF
2172.742 R29 18FF01F4 B8 88 FE D4 00 00 01 FF
```

and csv

```csv
timestamp,datapt1,datapt2
0.00, -11.73, -10.20
0.11, -11.73, -11.73
0.22, -11.73, -10.20
0.32, -11.73, -11.73
0.42, -11.73, -11.73
0.52, -11.73, -11.73
0.62, -11.73, -11.73
```
## Folder Structure

.
├── electron
│ ├── main.js
│ └── preload.js
├── .oxlintrc.json
├── gui
├── index.html
├── package.json
├── pnpm-lock.yaml
├── public
│ └── logo.jpg
├── README.md
├── src
│ ├── App.css
│ ├── App.jsx
│ ├── assets
│ │ └── examples
│ │ ├── random_correct_messages
│ │ │ └── random_correct_messages.ino
│ │ ├── simple_pitwall.json
│ │ ├── simple_serial_test
│ │ │ ├── arduino_counterpart
│ │ │ │ └── arduino_counterpart.ino
│ │ │ └── var.jsx
│ │ └── test-config.json
│ ├── components
│ │ ├── BMS.css
│ │ ├── BMS.jsx
│ │ ├── ControlBar.jsx
│ │ ├── Editor.jsx
│ │ ├── Palette.jsx
│ │ ├── parsers
│ │ │ └── canproc.jsx
│ │ ├── RadioWidget.css
│ │ ├── RadioWidget.jsx
│ │ ├── RawSerialWidget.css
│ │ └── RawSerialWidget.jsx
│ ├── index.css
│ ├── main.jsx
│ ├── pages
│ │ └── Home.jsx
│ └── utils
│ ├── config.js
│ └── crtdParser.js
└── vite.config.js

---