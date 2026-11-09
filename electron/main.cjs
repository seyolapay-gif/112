const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const fs = require('fs');

const registerApiRoutes = require('./api-server.cjs');

// Determine best writable app data directory
let dataDir;
try {
  const installFolder = path.dirname(app.getPath('exe'));
  const candidate = path.join(installFolder, 'app_data');
  if (!fs.existsSync(candidate)) {
    fs.mkdirSync(candidate, { recursive: true });
  }
  const testFile = path.join(candidate, '.write_test');
  fs.writeFileSync(testFile, 'ok');
  fs.unlinkSync(testFile);
  dataDir = candidate;
} catch (e) {
  dataDir = path.join(app.getPath('userData'), 'app_data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

let mainWindow = null;
let serverInstance = null;
const PORT = process.env.PORT || 3456;

function startLocalServer() {
  const localApp = express();
  localApp.use(express.json({ limit: '50mb' }));
  localApp.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 1. Mount complete local offline database and API router (Vaults, Lines, Transfers, Auth, etc.)
  registerApiRoutes(localApp, dataDir);

  // 2. Serve static build from dist folder
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    localApp.use(express.static(distPath));
    localApp.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  serverInstance = localApp.listen(PORT, '127.0.0.1', () => {
    console.log(`Local Cash Management Desktop Server running on http://127.0.0.1:${PORT}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 480,
    title: 'نظام إدارة التحويلات المالية الذكي',
    icon: path.join(__dirname, '..', 'public', 'icon.png'),
    backgroundColor: '#020617',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    autoHideMenuBar: true,
  });

  // Load local web app
  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startLocalServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverInstance) serverInstance.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
