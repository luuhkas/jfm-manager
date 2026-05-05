const { appendAuditLog } = require("./audit");

function registerHourBankIpc(ipcMain, db) {
  ipcMain.handle("hourBank:listByEmployee", (_evt, employeeId) => {
    return db.prepare(`
      SELECT id, employee_id as employeeId, month_key as monthKey,
             minutes, note, created_at as createdAt
      FROM hour_bank_compensations
      WHERE employee_id = ?
      ORDER BY month_key DESC, created_at DESC
    `).all(employeeId);
  });

  ipcMain.handle("hourBank:listAll", () => {
    return db.prepare(`
      SELECT h.id, h.employee_id as employeeId, h.month_key as monthKey,
             h.minutes, h.note, h.created_at as createdAt, e.name as employeeName
      FROM hour_bank_compensations h
      JOIN employees e ON e.id = h.employee_id
      ORDER BY h.month_key DESC, h.created_at DESC
    `).all();
  });

  ipcMain.handle("hourBank:add", (_evt, entry) => {
    if (!entry?.id || !entry?.employeeId || !entry?.monthKey) {
      throw new Error("Dados de compensação inválidos.");
    }
    if (!Number.isInteger(entry.minutes) || entry.minutes === 0) {
      throw new Error("Minutos de compensação devem ser um inteiro não-zero.");
    }

    const createdAt = entry.createdAt ?? new Date().toISOString();
    db.prepare(`
      INSERT INTO hour_bank_compensations (id, employee_id, month_key, minutes, note, created_at)
      VALUES (@id, @employeeId, @monthKey, @minutes, @note, @createdAt)
    `).run({ ...entry, note: entry.note ?? "", createdAt });

    appendAuditLog(db, {
      action: "create",
      entity: "hour_bank_compensation",
      entityId: entry.id,
      description: `Banco de horas: ${entry.minutes > 0 ? "+" : ""}${entry.minutes} min em ${entry.monthKey}.`,
      metadata: { employeeId: entry.employeeId, monthKey: entry.monthKey },
    });

    return { ...entry, createdAt };
  });

  ipcMain.handle("hourBank:delete", (_evt, id) => {
    if (!id) throw new Error("ID inválido.");
    db.prepare("DELETE FROM hour_bank_compensations WHERE id = ?").run(id);
    return true;
  });
}

module.exports = { registerHourBankIpc };
