const { randomUUID } = require("crypto");
const { assertIsoDate } = require("./validators");

function appendAuditLog(db, { action, entity, entityId, description, metadata = {} }) {
  db.prepare(
    `
    INSERT INTO audit_logs (id, action, entity, entity_id, description, created_at, metadata)
    VALUES (@id, @action, @entity, @entityId, @description, @createdAt, @metadata)
  `
  ).run({
    id: randomUUID(),
    action,
    entity,
    entityId,
    description,
    createdAt: new Date().toISOString(),
    metadata: JSON.stringify(metadata),
  });
}

function mapAuditLog(row) {
  return {
    id: row.id,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    description: row.description,
    createdAt: row.createdAt,
    metadata: row.metadata,
  };
}

function registerAuditIpc(ipcMain, db) {
  ipcMain.handle("audit:listByRange", (_evt, range) => {
    assertIsoDate(range?.startDate, "Data inicial");
    assertIsoDate(range?.endDate, "Data final");

    const start = `${range.startDate}T00:00:00.000Z`;
    const end = `${range.endDate}T23:59:59.999Z`;
    return db
      .prepare(
        `
        SELECT
          id,
          action,
          entity,
          entity_id as entityId,
          description,
          created_at as createdAt,
          metadata
        FROM audit_logs
        WHERE created_at >= @start AND created_at <= @end
        ORDER BY created_at DESC
      `
      )
      .all({ start, end })
      .map(mapAuditLog);
  });
}

module.exports = { appendAuditLog, registerAuditIpc };
