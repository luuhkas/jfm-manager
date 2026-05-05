const { assertMonthKey } = require("./validators");
const { appendAuditLog } = require("./audit");

function mapMonthClosing(row) {
  if (!row) return null;

  return {
    monthKey: row.monthKey,
    closedAt: row.closedAt,
    closedBy: row.closedBy,
    note: row.note,
  };
}

function isMonthClosed(db, monthKey) {
  assertMonthKey(monthKey, "Competência");
  const row = db.prepare("SELECT month_key FROM month_closings WHERE month_key = ?").get(monthKey);
  return Boolean(row);
}

function assertMonthIsOpen(db, dateKey) {
  const monthKey = dateKey.slice(0, 7);
  if (isMonthClosed(db, monthKey)) {
    throw new Error("Competência fechada. Reabra o mês para alterar registros.");
  }
}

function registerMonthClosingsIpc(ipcMain, db) {
  ipcMain.handle("monthClosings:get", (_evt, monthKey) => {
    assertMonthKey(monthKey, "Competência");

    const row = db
      .prepare(
        `
        SELECT
          month_key as monthKey,
          closed_at as closedAt,
          closed_by as closedBy,
          note
        FROM month_closings
        WHERE month_key = ?
      `
      )
      .get(monthKey);

    return mapMonthClosing(row);
  });

  ipcMain.handle("monthClosings:close", (_evt, closing) => {
    assertMonthKey(closing?.monthKey, "Competência");

    const saved = {
      monthKey: closing.monthKey,
      closedAt: typeof closing.closedAt === "string" ? closing.closedAt : new Date().toISOString(),
      closedBy: typeof closing.closedBy === "string" && closing.closedBy.trim() ? closing.closedBy.trim() : "manager",
      note: typeof closing.note === "string" ? closing.note.trim() : "",
    };

    db.prepare(
      `
      INSERT INTO month_closings (month_key, closed_at, closed_by, note)
      VALUES (@monthKey, @closedAt, @closedBy, @note)
      ON CONFLICT(month_key) DO UPDATE SET
        closed_at=excluded.closed_at,
        closed_by=excluded.closed_by,
        note=excluded.note
    `
    ).run(saved);

    appendAuditLog(db, {
      action: "close",
      entity: "month_closing",
      entityId: saved.monthKey,
      description: `Competência ${saved.monthKey} fechada.`,
      metadata: { note: saved.note },
    });

    return saved;
  });

  ipcMain.handle("monthClosings:reopen", (_evt, monthKey) => {
    assertMonthKey(monthKey, "Competência");
    db.prepare("DELETE FROM month_closings WHERE month_key = ?").run(monthKey);
    appendAuditLog(db, {
      action: "reopen",
      entity: "month_closing",
      entityId: monthKey,
      description: `Competência ${monthKey} reaberta.`,
    });
    return true;
  });
}

module.exports = {
  assertMonthIsOpen,
  isMonthClosed,
  registerMonthClosingsIpc,
};
