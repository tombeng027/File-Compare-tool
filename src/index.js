const {app, BrowserWindow, Menu, MenuItem, ipcMain, shell} = require('electron');
const fs = require('fs');
const $ = require('jquery');

let mainWindow;
const config = JSON.parse(fs.readFileSync('./src/environment/config/config.json','utf8'));
let configWindow;
//window creation
function createWindow(){
    mainWindow = new BrowserWindow({ minWidth:600, minHeight:600,width:1066, height:700, resizable:true, webPreferences: {
        plugins: true
      }});
      loginWindow = new BrowserWindow({ parent:mainWindow, modal:true, width:350 , height:350, frame:false,
      fullscreen:false, webPreferences: { plugins: true }})
      loginWindow.loadFile('./src/app/sso/ssologin.html');
      loginWindow.setMenuBarVisibility(false);
      mainWindow.hide();
      global.login = {loggedIn:false};
      loginWindow.on('closed',()=>{
      if(global.login.loggedIn){
          if(config.fullscreen == false)mainWindow.maximize();
              mainWindow.show();
              mainWindow.loadFile('./src/index.html');
              mainWindow.setMenuBarVisibility(false);
              //  mainWindow.setAutoHideMenuBar(true);
              mainWindow.maximize();
              mainWindow.on('closed', () => {
              mainWindow = null;
              });
       }else{
         mainWindow.close();
         mainWindow = null;
       }
     });
     global.shared = {index:0,images:undefined,workerid:undefined};
     global.mainWindow = mainWindow;
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
        mainWindow.removeAllListeners('close');
      }
});
//context menu set up
const menu = new Menu()
if(!config.onBPO){
  menu.append(new MenuItem({ id:'reset', label: 'Reset', role:'reload'}));
}else{
  menu.append(new MenuItem({ id:'gde', label: 'QA-GDE' }));
}

app.on('browser-window-created', (event, win) => {
  win.webContents.on('context-menu', (e, params) => {
    menu.popup(win, params.x, params.y)
  })
});

ipcMain.on('show-context-menu', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  menu.popup(win)
});