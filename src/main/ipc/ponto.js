const { assertIsoDate, assertNonEmptyString } = require("./validators");
const { appendAuditLog } = require("./audit");
const { assertMonthIsOpen } = require("./monthClosings");

function mapTimeEvent(row) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    timestamp: row.timestamp,
    workDate: row.workDate,
    type: row.type,
    source: row.source,
    note: row.note,
  };
}

function mapAdjustment(row) {
  return {
    id: row.id,
    eventId: row.eventId,
    employeeId: row.employeeId,
    timestamp: row.timestamp,
    workDate: row.workDate,
    type: row.type,
    reason: row.reason,
    createdAt: row.createdAt,
  };
}

function assertTimeEvent(ev) {
  if (!ev || typeof ev !== "object") {
    throw new Error("Evento de ponto inválido.");
  }

  assertNonEmptyString(ev.id, "ID do evento");
  assertNonEmptyString(ev.employeeId, "Funcionário");
  assertIsoDate(ev.workDate, "Data do ponto");

  if (ev.type !== "IN" && ev.type !== "OUT") {
    throw new Error("Tipo de marcação inválido.");
  }

  const timestamp = new Date(ev.timestamp);
  if (typeof ev.timestamp !== "string" || Number.isNaN(timestamp.getTime())) {
    throw new Error("Horário da marcação inválido.");
  }
}

function assertTimeAdjustment(adjustment) {
  if (!adjustment || typeof adjustment !== "object") {
    throw new Error("Ajuste de ponto inválido.");
  }

  assertNonEmptyString(adjustment.id, "ID do ajuste");
  assertNonEmptyString(adjustment.eventId, "ID do evento ajustado");
  assertNonEmptyString(adjustment.employeeId, "Funcionário");
  assertIsoDate(adjustment.workDate, "Data do ajuste");
  assertNonEmptyString(adjustment.reason, "Motivo do ajuste");

  if (adjustment.type !== "IN" && adjustment.type !== "OUT") {
    throw new Error("Tipo de ajuste inválido.");
  }

  const timestamp = new Date(adjustment.timestamp);
  if (typeof adjustment.timestamp !== "string" || Number.isNaN(timestamp.getTime())) {
    throw new Error("Horário do ajuste inválido.");
  }
}

function assertCanRegisterEvent(db, ev) {
  const employee = db.prepare("SELECT id, active FROM employees WHERE id = ?").get(ev.employeeId);
  if (!employee) {
    throw new Error("Funcionário não cadastrado.");
  }

  if (!employee.active) {
    throw new Error("Funcionário inativo não pode registrar ponto.");
  }

  const last = db
    .prepare(
      `
      SELECT type
      FROM time_events
      WHERE employee_id = ? AND work_date = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `
    )
    .get(ev.employeeId, ev.workDate);

  if (!last && ev.type !== "IN") {
    throw new Error("A primeira marcação do dia precisa ser entrada.");
  }

  if (last?.type === ev.type) {
    throw new Error("Marcação repetida. Registre entrada e saída alternadamente.");
  }
}

function assertCanInsertEventInDay(db, ev) {
  const employee = db.prepare("SELECT id FROM employees WHERE id = ?").get(ev.employeeId);
  if (!employee) {
    throw new Error("Funcionário não cadastrado.");
  }

  const existing = db
    .prepare(
      `
      SELECT id, type, timestamp
      FROM time_events
      WHERE employee_id = ? AND work_date = ?
      ORDER BY timestamp ASC
    `
    )
    .all(ev.employeeId, ev.workDate);

  const ordered = [...existing, { id: ev.id, type: ev.type, timestamp: ev.timestamp }].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (ordered[0]?.type !== "IN") {
    throw new Error("A primeira marcação do dia precisa ser entrada.");
  }

  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i].type === ordered[i - 1].type) {
      throw new Error("O ajuste quebraria a alternância de entrada e saída.");
    }
  }
}

function registerPontoIpc(ipcMain, db) {
  ipcMain.handle("ponto:listByDate", (_evt, workDate) => {
    assertIsoDate(workDate, "Data do ponto");

    const stmt = db.prepare(`
      SELECT
        id,
        employee_id as employeeId,
        timestamp,
        work_date as workDate,
        type,
        source,
        note
      FROM time_events
      WHERE work_date = ?
      ORDER BY timestamp ASC
    `);
    return stmt.all(workDate).map(mapTimeEvent);
  });

  ipcMain.handle("ponto:listByRange", (_evt, range) => {
    assertIsoDate(range?.startDate, "Data inicial");
    assertIsoDate(range?.endDate, "Data final");

    const stmt = db.prepare(`
      SELECT
        id,
        employee_id as employeeId,
        timestamp,
        work_date as workDate,
        type,
        source,
        note
      FROM time_events
      WHERE work_date >= @startDate AND work_date <= @endDate
      ORDER BY work_date ASC, timestamp ASC
    `);
    return stmt.all(range).map(mapTimeEvent);
  });

  ipcMain.handle("ponto:addEvent", (_evt, ev) => {
    assertTimeEvent(ev);
    assertMonthIsOpen(db, ev.workDate);
    assertCanRegisterEvent(db, ev);

    const stmt = db.prepare(`
      INSERT INTO time_events (id, employee_id, timestamp, work_date, type, source, note)
      VALUES (@id, @employeeId, @timestamp, @workDate, @type, @source, @note)
    `);
    stmt.run({
      ...ev,
      source: ev.source ?? "manager",
      note: ev.note ?? null,
    });
    appendAuditLog(db, {
      action: "create",
      entity: "time_event",
      entityId: ev.id,
      description: `Marcação ${ev.type} registrada em ${ev.workDate}.`,
      metadata: { employeeId: ev.employeeId, workDate: ev.workDate, type: ev.type },
    });
    return ev;
  });

  ipcMain.handle("ponto:deleteEvent", (_evt, id) => {
    assertNonEmptyString(id, "ID do evento");
    const ev = db.prepare("SELECT id, work_date, source FROM time_events WHERE id = ?").get(id);
    if (!ev) return true;
    if (ev.source !== "manager") throw new Error("Só é possível desfazer marcações diretas.");
    assertMonthIsOpen(db, ev.work_date);
    db.prepare("DELETE FROM time_events WHERE id = ?").run(id);
    appendAuditLog(db, { action: "delete", entity: "time_event", entityId: id, description: `Marcação desfeita em ${ev.work_date}.` });
    return true;
  });

  ipcMain.handle("ponto:listAdjustmentsByRange", (_evt, range) => {
    assertIsoDate(range?.startDate, "Data inicial");
    assertIsoDate(range?.endDate, "Data final");

    const stmt = db.prepare(`
      SELECT
        id,
        event_id as eventId,
        employee_id as employeeId,
        timestamp,
        work_date as workDate,
        type,
        reason,
        created_at as createdAt
      FROM time_adjustments
      WHERE work_date >= @startDate AND work_date <= @endDate
      ORDER BY created_at DESC
    `);
    return stmt.all(range).map(mapAdjustment);
  });

  ipcMain.handle("ponto:addAdjustment", (_evt, adjustment) => {
    assertTimeAdjustment(adjustment);
    assertMonthIsOpen(db, adjustment.workDate);

    const event = {
      id: adjustment.eventId,
      employeeId: adjustment.employeeId,
      timestamp: adjustment.timestamp,
      workDate: adjustment.workDate,
      type: adjustment.type,
      source: "adjustment",
      note: adjustment.reason.trim(),
    };

    assertCanInsertEventInDay(db, event);

    const createdAt = adjustment.createdAt ?? new Date().toISOString();
    const tx = db.transaction(() => {
      db.prepare(
        `
        INSERT INTO time_events (id, employee_id, timestamp, work_date, type, source, note)
        VALUES (@id, @employeeId, @timestamp, @workDate, @type, @source, @note)
      `
      ).run(event);

      db.prepare(
        `
        INSERT INTO time_adjustments (
          id,
          event_id,
          employee_id,
          timestamp,
          work_date,
          type,
          reason,
          created_at
        )
        VALUES (
          @id,
          @eventId,
          @employeeId,
          @timestamp,
          @workDate,
          @type,
          @reason,
          @createdAt
        )
      `
      ).run({
        ...adjustment,
        reason: adjustment.reason.trim(),
        createdAt,
      });
    });

    tx();
    appendAuditLog(db, {
      action: "create",
      entity: "time_adjustment",
      entityId: adjustment.id,
      description: `Ajuste ${adjustment.type} criado em ${adjustment.workDate}: ${adjustment.reason.trim()}.`,
      metadata: { employeeId: adjustment.employeeId, workDate: adjustment.workDate, type: adjustment.type },
    });
    return { ...adjustment, createdAt };
  });
}

module.exports = { registerPontoIpc };
