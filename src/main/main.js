const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { openDb } = require("./db");
const { registerAuditIpc } = require("./ipc/audit");
const { registerDatabaseIpc } = require("./ipc/database");
const { registerEmployeesIpc } = require("./ipc/employees");
const { registerHolidaysIpc } = require("./ipc/holidays");
const { registerMonthClosingsIpc } = require("./ipc/monthClosings");
const { registerPontoIpc } = require("./ipc/ponto");
const { registerHourBankIpc } = require("./ipc/hourBank");
const { registerWorkOrdersIpc } = require("./ipc/workOrders");
const { registerSettingsIpc } = require("./ipc/settings");
const { registerPdfIpc } = require("./ipc/pdf");
const { registerEsocialIpc } = require("./ipc/esocial");
const { registerSalaryHistoryIpc } = require("./ipc/salaryHistory");

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../renderer/dist/index.html"));
  }
}

function registerIpc(db) {
  registerDatabaseIpc(ipcMain, { app, db, dbPath: db.jfmPath, dialog });
  registerAuditIpc(ipcMain, db);
  registerEmployeesIpc(ipcMain, db);
  registerPontoIpc(ipcMain, db);
  registerHolidaysIpc(ipcMain, db);
  registerMonthClosingsIpc(ipcMain, db);
  registerHourBankIpc(ipcMain, db);
  registerWorkOrdersIpc(ipcMain, db);
  registerSettingsIpc(ipcMain, db);
  registerPdfIpc(ipcMain, { dialog });
  registerEsocialIpc(ipcMain, { dialog });
  registerSalaryHistoryIpc(ipcMain, db);
}

function getAppDbPath() {
  const dbPath = path.join(app.getPath("userData"), "jfm.sqlite");
  const legacyDbPath = path.join(__dirname, "..", "..", "data", "jfm.sqlite");

  if (!fs.existsSync(dbPath) && fs.existsSync(legacyDbPath)) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.copyFileSync(legacyDbPath, dbPath);
  }

  return dbPath;
}

function scheduleAutoBackup(db, dbPath) {
  const INTERVAL_MS = 24 * 60 * 60 * 1000;

  function doBackup() {
    try {
      const settings = db.prepare("SELECT value FROM app_settings WHERE key = 'autoBackupEnabled'").get();
      if (!settings || settings.value !== "true") return;

      const dirRow = db.prepare("SELECT value FROM app_settings WHERE key = 'autoBackupDir'").get();
      const defaultBackupDir = path.join(app.getPath("documents"), "JFM Backups");
      const candidateDir = dirRow?.value ? path.resolve(dirRow.value) : defaultBackupDir;
      const allowedRoots = [app.getPath("documents"), app.getPath("userData"), app.getPath("desktop")].map(path.resolve);
      const backupDir = allowedRoots.some((root) => candidateDir.startsWith(root + path.sep) || candidateDir === root)
        ? candidateDir
        : defaultBackupDir;

      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

      const today = new Date().toISOString().slice(0, 10);
      const dest = path.join(backupDir, `jfm-backup-${today}.sqlite`);
      fs.copyFileSync(dbPath, dest);

      const files = fs.readdirSync(backupDir)
        .filter((f) => f.startsWith("jfm-backup-") && f.endsWith(".sqlite"))
        .sort();

      while (files.length > 30) {
        fs.unlinkSync(path.join(backupDir, files.shift()));
      }
    } catch {
      // silent — backup is best-effort
    }
  }

  doBackup();
  setInterval(doBackup, INTERVAL_MS);
}

app.whenReady().then(() => {
  const dbPath = getAppDbPath();
  const db = openDb(dbPath);
  registerIpc(db);
  createWindow();
  scheduleAutoBackup(db, dbPath);
});
