const { app, BrowserWindow } = require('electron');
const path = require('path');

// Function to create the main window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load your Next.js app in the Electron window
  mainWindow.loadURL('https://globuddy.vercel.app'); // URL where your Next.js app is running
}

// When Electron is ready, create the window
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
