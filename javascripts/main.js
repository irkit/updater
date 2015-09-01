'use strict';
var app = require('app');  // Module to control application life.
var util = require('util');
var path = require('path');
var os = require('os');
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var Menu = require('menu');
var packageJSON = require('../package.json');

var appName = 'IRKit Updater';

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600, title: appName });

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/../index.html');

  if (process.env.NODE_ENV === "development") {
    mainWindow.openDevTools();
  }

  makeMenu(mainWindow);

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});

function makeMenu (win) {
  var template, menu;
  if (process.platform == 'darwin') {
    template = [
      {
        label: appName,
        submenu: [
          {
            label: 'About ' + appName + ' (v' + packageJSON.version + ')',
            click: function() { require('shell').openExternal('http://github.com/irkit/updater'); }
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() { app.quit(); }
          },
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: function() { mainWindow.restart(); }
          },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+Command+I',
            click: function() { mainWindow.toggleDevTools(); }
          },
        ]
      }
    ];

    menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } else {
    template = [
      {
        label: '&File',
        submenu: [
          {
            label: '&About ' + appName + ' (v' + packageJSON.version + ')',
            click: function() { require('shell').openExternal('http://github.com/irkit/updater'); }
          },
          {
            type: 'separator'
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: function() { mainWindow.close(); }
          },
        ]
      },
      {
        label: '&View',
        submenu: [
          {
            label: '&Reload',
            accelerator: 'Ctrl+R',
            click: function() { mainWindow.restart(); }
          },
          {
            label: 'Toggle &Developer Tools',
            accelerator: 'Alt+Ctrl+I',
            click: function() { mainWindow.toggleDevTools(); }
          },
        ]
      }
    ];

    menu = Menu.buildFromTemplate(template);
    win.setMenu(menu);
  }
}
