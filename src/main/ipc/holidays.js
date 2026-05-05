const { assertIsoDate, assertNonEmptyString } = require("./validators");
const { appendAuditLog } = require("./audit");
const { assertMonthIsOpen } = require("./monthClosings");

function mapHoliday(row) {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    scope: row.scope,
  };
}

function assertHoliday(holiday) {
  if (!holiday || typeof holiday !== "object") {
    throw new Error("Feriado inválido.");
  }

  assertNonEmptyString(holiday.id, "ID do feriado");
  assertIsoDate(holiday.date, "Data do feriado");
  assertNonEmptyString(holiday.name, "Nome do feriado");

  if (!["national", "state", "city", "company"].includes(holiday.scope)) {
    throw new Error("Tipo de feriado inválido.");
  }
}

function registerHolidaysIpc(ipcMain, db) {
  ipcMain.handle("holidays:listByRange", (_evt, range) => {
    assertIsoDate(range?.startDate, "Data inicial");
    assertIsoDate(range?.endDate, "Data final");

    const stmt = db.prepare(`
      SELECT id, date, name, scope
      FROM holidays
      WHERE date >= @startDate AND date <= @endDate
      ORDER BY date ASC, name ASC
    `);
    return stmt.all(range).map(mapHoliday);
  });

  ipcMain.handle("holidays:upsert", (_evt, holiday) => {
    assertHoliday(holiday);
    assertMonthIsOpen(db, holiday.date);

    db.prepare(
      `
      INSERT INTO holidays (id, date, name, scope)
      VALUES (@id, @date, @name, @scope)
      ON CONFLICT(id) DO UPDATE SET
        date=excluded.date,
        name=excluded.name,
        scope=excluded.scope
    `
    ).run({
      ...holiday,
      name: holiday.name.trim(),
    });

    appendAuditLog(db, {
      action: "upsert",
      entity: "holiday",
      entityId: holiday.id,
      description: `Feriado ${holiday.name.trim()} salvo em ${holiday.date}.`,
      metadata: { date: holiday.date, scope: holiday.scope },
    });

    return { ...holiday, name: holiday.name.trim() };
  });

  ipcMain.handle("holidays:delete", (_evt, id) => {
    assertNonEmptyString(id, "ID do feriado");
    const holiday = db.prepare("SELECT date FROM holidays WHERE id = ?").get(id);
    if (holiday) {
      assertMonthIsOpen(db, holiday.date);
    }
    db.prepare("DELETE FROM holidays WHERE id = ?").run(id);
    appendAuditLog(db, {
      action: "delete",
      entity: "holiday",
      entityId: id,
      description: `Feriado removido.`,
      metadata: holiday ? { date: holiday.date } : {},
    });
    return true;
  });
}

module.exports = { registerHolidaysIpc };
