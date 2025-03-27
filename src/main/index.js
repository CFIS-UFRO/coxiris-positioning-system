import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import log from 'electron-log'
import { LOG_FILE_DIR, CACHE_FOLDER_DIR, USER_DATA_FILE_DIR } from './utils/paths.js';
import { createMenu } from './menu.js';
import { initializeLanguage } from './utils/lang.js'
import { initializeTheme } from './utils/theme.js'
import packageJson from '../../package.json'
import ApiServer from './api-server.js';

// Configure logging
log.errorHandler.startCatching();
log.eventLogger.startLogging();
log.initialize();

// Initial message
log.info('Starting the app...');
log.info('Log file:', LOG_FILE_DIR);
log.info('Cache folder:', CACHE_FOLDER_DIR);
log.info('User data file:', USER_DATA_FILE_DIR);

// Expose repo URL to renderer
ipcMain.on('get-repo', (event) => {
  event.returnValue = packageJson.repository;
});

// Init server if apply
let apiServer = null;
if (packageJson.port) {
  log.info('Starting API server...');
  apiServer = new ApiServer(packageJson.port);
  apiServer.start();
}
else {
  log.info('"port" not found in package.json, skipping API server...');
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  // Initialize language settings
  initializeLanguage();

  // Initialize theme settings
  initializeTheme();

  // Create application menu
  createMenu(mainWindow);

  // Show the window when it's ready
  mainWindow.on('ready-to-show', () => {
    mainWindow.setTitle(packageJson.productName);
    mainWindow.show()
  })

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // When quitting the app
  app.on('quit', async () => {
    if (apiServer) {
      log.info('Stopping API server...');
      await apiServer.stop();
    }
    log.info('Quitting the app...');
  })

})