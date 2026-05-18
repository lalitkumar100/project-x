const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let centralServerProcess;
let dbProcess;

// Keep track of child processes to kill them gracefully when the app closes
const processes = [];

function startDatabase() {
  console.log("Starting bundled PostgreSQL database...");
  const pgctlPath = path.join(__dirname, 'pgsql', 'bin', 'pg_ctl.exe');
  const dataPath = path.join(__dirname, 'pgsql', 'data');
  
  // Attempt to start the database
  try {
    dbProcess = spawn(pgctlPath, ['start', '-D', dataPath, '-w'], {
      detached: true,
      stdio: 'ignore'
    });
    // Let it run independently of the main node process loop
    dbProcess.unref();
  } catch(e) {
    console.error("Could not start PostgreSQL. Ensure the pgsql folder exists.", e);
  }
}

function stopDatabase() {
  console.log("Stopping PostgreSQL database...");
  const pgctlPath = path.join(__dirname, 'pgsql', 'bin', 'pg_ctl.exe');
  const dataPath = path.join(__dirname, 'pgsql', 'data');
  
  const { execSync } = require('child_process');
  try {
    // Graceful fast shutdown
    execSync(`"${pgctlPath}" stop -D "${dataPath}" -m fast`);
  } catch(e) {
    console.error("Failed to stop database gracefully:", e.message);
  }
}

function startBackendServers() {
  console.log("Starting backend servers...");

  // Start back-end (explicitly connecting to the embedded PostgreSQL instance)
  backendProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'back-end'),
    env: { 
      ...process.env, 
      PORT: 5000,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USER: 'postgres'
    },
    stdio: 'inherit'
  });
  processes.push(backendProcess);

  // Start central-server
  centralServerProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, 'central-server'),
    env: { ...process.env, PORT: 8000 },
    stdio: 'inherit'
  });
  processes.push(centralServerProcess);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "TradeCore Desktop",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'frontend/public/assets/log1.png')
  });

  // Check if we are running in development or production
  const isDev = !app.isPackaged;

  if (isDev) {
    // In development, load the Vite dev server
    // We add a slight delay to give Vite time to start if run concurrently
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:5173/startup');
    }, 2000);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start standalone PostgreSQL Database
  startDatabase();

  // Give the database a few seconds to initialize and accept connections
  setTimeout(() => {
    // Start backend Node.js servers
    startBackendServers();

    // Create the Electron window
    createWindow();
  }, 3000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Graceful shutdown of child processes
app.on('before-quit', () => {
  console.log("Shutting down system...");
  
  // Stop database cleanly
  stopDatabase();
  
  processes.forEach(proc => {
    if (proc && !proc.killed) {
      // In Windows, process.kill doesn't always kill children of the process
      // but for simple node scripts, it should be enough to send SIGINT
      try {
        proc.kill('SIGINT');
      } catch (e) {
        console.error("Failed to kill process:", e);
      }
    }
  });
});
