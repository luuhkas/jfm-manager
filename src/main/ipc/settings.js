function registerSettingsIpc(ipcMain, db) {
  ipcMain.handle("settings:get", (_evt, key) => {
    if (!key) throw new Error("Chave inválida.");
    const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key);
    return row ? row.value : null;
  });

  ipcMain.handle("settings:getAll", () => {
    const rows = db.prepare("SELECT key, value FROM app_settings").all();
    const result = {};
    for (const row of rows) result[row.key] = row.value;
    return result;
  });

  ipcMain.handle("settings:set", (_evt, key, value) => {
    if (!key) throw new Error("Chave inválida.");
    db.prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `).run(key, String(value ?? ""));
    return true;
  });

  ipcMain.handle("settings:setMany", (_evt, entries) => {
    if (!entries || typeof entries !== "object") throw new Error("Entradas inválidas.");
    const stmt = db.prepare(`
      INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);
    const tx = db.transaction((obj) => {
      for (const [k, v] of Object.entries(obj)) stmt.run(k, String(v ?? ""));
    });
    tx(entries);
    return true;
  });
}

module.exports = { registerSettingsIpc };
