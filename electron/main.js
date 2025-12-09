import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Handling ESM paths in Electron
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Detect environment
const isDev = !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    // Optional: Try to load an icon if it exists
    icon: path.join(__dirname, '../public/icon.ico') 
  });

  if (isDev) {
    // In Development: Load Vite Dev Server
    // Ensure 'npm run dev' is running on port 5173
    console.log('Development Mode: Loading http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In Production: Load Local Express Server
    console.log('Production Mode: Loading http://127.0.0.1:3001');
    mainWindow.loadURL('http://127.0.0.1:3001');
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // 1. Set User Data Path for SQLite
  process.env.USER_DATA_PATH = app.getPath('userData');

  // 2. Start the Express Server
  // Only start internally if we are in Production.
  // In Development, 'concurrently' runs the server externally to allow for logs/restarts.
  if (!isDev) {
      const serverPath = path.join(__dirname, '..', 'server.js');
      try {
          // Fix for Windows ESM import: must be a valid file:// URL
          const serverUrl = pathToFileURL(serverPath).href;
          await import(serverUrl);
          console.log('Internal Server started');
      } catch (err) {
          console.error('Failed to start server:', err);
      }
  } else {
      console.log('Skipping internal server start (handled by external script in Dev)');
  }

  // 3. Create Window
  createWindow();

  app.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});