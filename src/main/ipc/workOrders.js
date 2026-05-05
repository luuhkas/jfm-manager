const { appendAuditLog } = require("./audit");

const VALID_STATUSES = ["open", "in_progress", "completed", "cancelled"];

function mapWorkOrder(row) {
  let employeeIds = [];
  try { employeeIds = JSON.parse(row.employeeIds || "[]"); } catch { /* default to empty */ }
  return {
    id: row.id,
    number: row.number,
    clientName: row.clientName,
    description: row.description,
    status: row.status,
    employeeIds,
    estimatedMinutes: row.estimatedMinutes,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    note: row.note,
  };
}

function registerWorkOrdersIpc(ipcMain, db) {
  ipcMain.handle("workOrders:list", (_evt, filters) => {
    const status = filters?.status;
    let query = `
      SELECT id, number, client_name as clientName, description, status,
             employee_ids as employeeIds, estimated_minutes as estimatedMinutes,
             created_at as createdAt, completed_at as completedAt, note
      FROM work_orders
    `;
    const params = [];

    if (status && VALID_STATUSES.includes(status)) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";
    return db.prepare(query).all(...params).map(mapWorkOrder);
  });

  ipcMain.handle("workOrders:upsert", (_evt, wo) => {
    if (!wo?.id || !wo?.number) throw new Error("OS inválida: ID e número são obrigatórios.");
    if (!VALID_STATUSES.includes(wo.status)) throw new Error("Status de OS inválido.");

    const employeeIds = JSON.stringify(Array.isArray(wo.employeeIds) ? wo.employeeIds : []);
    const createdAt = wo.createdAt ?? new Date().toISOString();

    db.prepare(`
      INSERT INTO work_orders (id, number, client_name, description, status, employee_ids,
                               estimated_minutes, created_at, completed_at, note)
      VALUES (@id, @number, @clientName, @description, @status, @employeeIds,
              @estimatedMinutes, @createdAt, @completedAt, @note)
      ON CONFLICT(id) DO UPDATE SET
        number=excluded.number,
        client_name=excluded.client_name,
        description=excluded.description,
        status=excluded.status,
        employee_ids=excluded.employee_ids,
        estimated_minutes=excluded.estimated_minutes,
        completed_at=excluded.completed_at,
        note=excluded.note
    `).run({
      id: wo.id,
      number: wo.number,
      clientName: wo.clientName ?? "",
      description: wo.description ?? "",
      status: wo.status,
      employeeIds,
      estimatedMinutes: Math.round(wo.estimatedMinutes ?? 0),
      createdAt,
      completedAt: wo.completedAt ?? null,
      note: wo.note ?? "",
    });

    appendAuditLog(db, {
      action: "upsert",
      entity: "work_order",
      entityId: wo.id,
      description: `OS ${wo.number} - ${wo.clientName || "sem cliente"} (${wo.status}).`,
    });

    return { ...wo, employeeIds: Array.isArray(wo.employeeIds) ? wo.employeeIds : [], createdAt };
  });

  ipcMain.handle("workOrders:delete", (_evt, id) => {
    if (!id) throw new Error("ID inválido.");
    db.prepare("DELETE FROM work_orders WHERE id = ?").run(id);
    appendAuditLog(db, {
      action: "delete",
      entity: "work_order",
      entityId: id,
      description: `OS ${id} excluída.`,
    });
    return true;
  });

  ipcMain.handle("workOrders:nextNumber", () => {
    const last = db.prepare(
      "SELECT number FROM work_orders ORDER BY created_at DESC LIMIT 1"
    ).get();

    if (!last) return "OS-0001";

    const match = last.number.match(/(\d+)$/);
    const next = match ? Number.parseInt(match[1], 10) + 1 : 1;
    return `OS-${String(next).padStart(4, "0")}`;
  });
}

module.exports = { registerWorkOrdersIpc };
