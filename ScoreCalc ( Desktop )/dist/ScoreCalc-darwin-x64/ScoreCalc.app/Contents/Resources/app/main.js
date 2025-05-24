const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  if (!backendProcess) {
    const backendPath = path.join(__dirname, 'backend', 'app.js');
    backendProcess = spawn(process.execPath, [backendPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: '3001' },
    });
    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
    });
    backendProcess.on('exit', (code) => {
      console.log('Backend process exited with code', code);
    });
  }
}

function createWindow() {
  if (mainWindow) return;
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#181824',
    title: 'ScoreCalc',
    show: false,
    icon: process.platform === 'darwin'
      ? path.join(__dirname, 'icon.icns')
      : process.platform === 'win32'
        ? path.join(__dirname, 'icon.ico')
        : path.join(__dirname, 'icon.png'),
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL('http://localhost:3001');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startBackend();
  setTimeout(() => {
    createWindow();
  }, 1200);
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('window-all-closed', function () {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 