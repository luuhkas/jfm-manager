const path = require("path");
const fs = require("fs");

function registerDatabaseIpc(ipcMain, { app, db, dbPath, dialog }) {
  ipcMain.handle("database:backup", async () => {
    const defaultPath = path.join(
      app.getPath("documents"),
      `jfm-manager-backup-${new Date().toISOString().slice(0, 10)}.sqlite`
    );
    const result = await dialog.showSaveDialog({
      title: "Salvar backup do JFM Manager",
      defaultPath,
      filters: [{ name: "SQLite", extensions: ["sqlite"] }],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }

    try {
      await db.backup(result.filePath);
      return { canceled: false, filePath: result.filePath };
    } catch (err) {
      throw new Error(`Falha ao salvar backup: ${err?.message ?? err}`);
    }
  });

  ipcMain.handle("database:restore", async () => {
    const result = await dialog.showOpenDialog({
      title: "Restaurar backup do JFM Manager",
      properties: ["openFile"],
      filters: [{ name: "SQLite", extensions: ["sqlite", "db"] }],
    });

    const sourcePath = result.filePaths[0];
    if (result.canceled || !sourcePath) {
      return { canceled: true };
    }

    try {
      const backupBeforeRestorePath = `${dbPath}.before-restore-${Date.now()}`;
      await db.backup(backupBeforeRestorePath);
      db.close();
      fs.copyFileSync(sourcePath, dbPath);
      app.relaunch();
      app.exit(0);
      return { canceled: false };
    } catch (err) {
      throw new Error(`Falha ao restaurar backup: ${err?.message ?? err}`);
    }
  });
}

module.exports = { registerDatabaseIpc };
