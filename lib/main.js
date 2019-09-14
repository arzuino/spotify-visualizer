'use strict';
const electronLocalshortcut = require('electron-localshortcut');
const electron = require('electron');
const { app, BrowserWindow } = require('electron');
const console = require('console');

let screen;
let displays;
let currentDisplay = 0;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 790,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    screen = electron.screen;
    displays = screen.getAllDisplays();
    console.log('enumerated', displays.length, 'displays.');
    mainWindow.setFullScreen(true);
    mainWindow.setMenu(null);

    // register two local shortcuts
    electronLocalshortcut.register('CommandOrControl+Shift+Left', function () {
        currentDisplay--;
        if (currentDisplay < 0) {
            currentDisplay = displays.length - 1;
        }
        currentDisplay %= (displays.length);
        console.log('switching to display', currentDisplay + 1, 'out of', displays.length);
        mainWindow.setFullScreen(false);
        setTimeout(function () {
            mainWindow.setBounds(displays[currentDisplay].bounds);
            mainWindow.setFullScreen(true);
        }, 100);
    });

    electronLocalshortcut.register('CommandOrControl+Shift+Right', function () {
        currentDisplay++;
        currentDisplay %= (displays.length);
        console.log('switching to display', currentDisplay + 1, 'out of', displays.length);
        mainWindow.setFullScreen(false);
        setTimeout(function () {
            mainWindow.setBounds(displays[currentDisplay].bounds);
            mainWindow.setFullScreen(true);
        }, 100);
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
