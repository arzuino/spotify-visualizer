'use strict';

const electronLocalshortcut = require('electron-localshortcut');
const electron = require('electron');

const request = require('request');
const SpotifyWebApi = require('spotify-web-api-node');
// Module to control application life.
const app = electron.app;

let screen;
let displays;
let currentDisplay = 0;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
require('dotenv').config();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 790,
    autoHideMenuBar: true
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
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
  electronLocalshortcut.register('CommandOrControl+Shift+Left', function() {
    currentDisplay--;
    if (currentDisplay < 0) {
      currentDisplay = displays.length - 1;
    }
    currentDisplay %= (displays.length);
    console.log('switching to display', currentDisplay + 1, 'out of', displays.length);
    mainWindow.setFullScreen(false);
    setTimeout(function() {
      mainWindow.setBounds(displays[currentDisplay].bounds);
      mainWindow.setFullScreen(true);
    }, 100);
  });

  electronLocalshortcut.register('CommandOrControl+Shift+Right', function() {
    currentDisplay++;
    currentDisplay %= (displays.length);
    console.log('switching to display', currentDisplay + 1, 'out of', displays.length);
    mainWindow.setFullScreen(false);
    setTimeout(function() {
      mainWindow.setBounds(displays[currentDisplay].bounds);
      mainWindow.setFullScreen(true);
    }, 100);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

var tokenExpirationEpoch = 0;
var lastSongName = "";
var songStartEpochMs = 0;
var songLengthMs = 0;
var playing = false;

var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

spotifyApi.setRefreshToken(process.env.REFRESH_TOKEN);
refreshApiKeys();

setInterval(function() {
  // Refresh access token if needed
  if ((tokenExpirationEpoch - new Date().getTime() / 1000) < 60) {
    refreshApiKeys();
  }
  // Get information about current playing song for signed in user
  spotifyApi.getMyCurrentPlaybackState({})
    .then(function(data) {
      // If paused and not first run
      if (data.body.is_playing == false && lastSongName !== "") {
        playing = false;
        // Set an info if playback is paused
        mainWindow.webContents.send('paused');
        console.log("Playback is paused");
      } else {
        // Only update cover and title if song is different
        var title = data.body.item.name;
        if (lastSongName !== title || playing == false) {
          lastSongName = title;
          var artists = getArtistsString(data.body.item.artists);
          console.log("Now Playing: " + title + " - " + artists);
          if (mainWindow !== null) {
            mainWindow.webContents.send('nextSong', title, artists);
            mainWindow.webContents.send('coverUrl', data.body.item.album.images[0].url);
          }
        }
        songLengthMs = data.body.item.duration_ms;
        songStartEpochMs = new Date().getTime() - data.body.progress_ms;
        playing = true;
      }
    }, function(err) {
      console.log('Something went wrong!', err);
    });
}, 2000);

setInterval(function() {
  if (mainWindow !== null && mainWindow !== undefined && playing == true) {
    // Update the progress bar
    var progress_ms = new Date().getTime() - songStartEpochMs;
    var progress_percent = (progress_ms / songLengthMs) * 100;
    mainWindow.webContents.send('progress', progress_percent);
  }
}, 30);

function getArtistsString(artists) {
  var toReturn = "";
  for (var i = 0; i < artists.length; i++) {
    toReturn = toReturn + artists[i].name + " & ";
  }
  toReturn = toReturn.slice(0, -2);
  return toReturn;
}

function refreshApiKeys() {
  spotifyApi.refreshAccessToken()
    .then(function(data) {
      spotifyApi.setAccessToken(data.body['access_token']);
      tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
      console.log('Refreshed token. It now expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
    }, function(err) {
      console.log('Could not refresh the token!', err.message);
    });
}
