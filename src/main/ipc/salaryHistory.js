function registerSalaryHistoryIpc(ipcMain, db) {
  ipcMain.handle("salaryHistory:listByEmployee", (_evt, employeeId) => {
    if (!employeeId) throw new Error("ID do funcionário inválido.");
    return db.prepare(`
      SELECT id, employee_id as employeeId, payment_type as paymentType,
             monthly_salary_cents as monthlySalaryCents,
             hourly_rate_cents as hourlyRateCents,
             effective_from as effectiveFrom, note, created_at as createdAt
      FROM salary_history
      WHERE employee_id = ?
      ORDER BY effective_from DESC, created_at DESC
    `).all(employeeId);
  });
}

const { randomUUID } = require("crypto");

function recordSalaryHistoryIfChanged(db, employeeId, contract) {
  if (!contract) return;

  const last = db.prepare(`
    SELECT monthly_salary_cents, hourly_rate_cents, payment_type
    FROM salary_history
    WHERE employee_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(employeeId);

  const changed =
    !last ||
    last.payment_type !== contract.paymentType ||
    last.monthly_salary_cents !== Math.round(contract.monthlySalaryCents) ||
    last.hourly_rate_cents !== Math.round(contract.hourlyRateCents);

  if (!changed) return;

  db.prepare(`
    INSERT INTO salary_history (id, employee_id, payment_type, monthly_salary_cents,
                                hourly_rate_cents, effective_from, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, '', ?)
  `).run(
    randomUUID(),
    employeeId,
    contract.paymentType,
    Math.round(contract.monthlySalaryCents),
    Math.round(contract.hourlyRateCents),
    contract.startDate ?? new Date().toISOString().slice(0, 10),
    new Date().toISOString()
  );
}

module.exports = { registerSalaryHistoryIpc, recordSalaryHistoryIfChanged };
