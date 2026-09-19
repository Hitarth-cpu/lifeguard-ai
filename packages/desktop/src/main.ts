import { app, BrowserWindow, Notification, ipcMain } from "electron";
import path from "path";

let mainWindow: BrowserWindow | null = null;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: "LifeGuard - Desktop Risk Sentinel",
    backgroundColor: "#0b0f19",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  mainWindow.loadURL(FRONTEND_URL).catch(() => {
    console.log(`[DESKTOP] Could not connect to ${FRONTEND_URL}, retrying...`);
    setTimeout(() => {
      mainWindow?.loadURL(FRONTEND_URL);
    }, 3000);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Display initial native desktop notification
  showNotification("LifeGuard Active Sentinel", "LifeGuard is monitoring environment risks on your desktop window.");
}

function showNotification(title: string, body: string) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      silent: false,
    });
    notification.show();
    notification.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}

// Setup IPC handlers with explicit type annotations
ipcMain.on("notify", (_event: any, data: { title: string; body: string }) => {
  showNotification(data.title, data.body);
});

ipcMain.on("focus-window", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
