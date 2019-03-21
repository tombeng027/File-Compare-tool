const {app, BrowserWindow, Menu, MenuItem, ipcMain, shell} = require('electron');
const fs = require('fs');
const $ = require('jquery');

let mainWindow;

//window creation
function createWindow(){
    mainWindow = new BrowserWindow({ minWidth:600, minHeight:600,width:1066, height:700, resizable:true, webPreferences: {
        plugins: true
      }});

    mainWindow.show();
    mainWindow.loadFile('./src/index.html');
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
    mainWindow.maximize();
    // global.shared = { schemaJSON:testinput };

    mainWindow.on('closed', () => {
    mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        mainWindow.removeAllListeners('close');
      }
});