const { assertIsoDate, assertNonEmptyString, assertNumber } = require("./validators");
const { appendAuditLog } = require("./audit");
const { recordSalaryHistoryIfChanged } = require("./salaryHistory");

function parseWorkDays(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [1, 2, 3, 4, 5];
  }

  return value
    .split(",")
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

function serializeWorkDays(value) {
  if (!Array.isArray(value)) {
    throw new Error("Escala semanal inválida.");
  }

  const unique = [...new Set(value.map((day) => Number(day)))].sort((a, b) => a - b);

  if (unique.length === 0 || unique.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error("Escala semanal inválida.");
  }

  return unique.join(",");
}

function mapEmployee(row) {
  const status = row.status || (row.active ? "active" : "inactive");
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf,
    role: row.role,
    admissionDate: row.admissionDate,
    status,
    active: status !== "inactive" && Boolean(row.active),
    contract: row.contractId
      ? {
          id: row.contractId,
          employeeId: row.id,
          paymentType: row.paymentType,
          monthlySalaryCents: row.monthlySalaryCents,
          hourlyRateCents: row.hourlyRateCents,
          weeklyHours: row.weeklyHours,
          dailyMinutes: row.dailyMinutes,
          monthlyHours: row.monthlyHours,
          workDays: parseWorkDays(row.workDays),
          overtimePercent: row.overtimePercent,
          nightPercent: row.nightPercent,
          startDate: row.contractStartDate,
          endDate: row.contractEndDate,
          active: Boolean(row.contractActive),
        }
      : null,
  };
}

function registerEmployeesIpc(ipcMain, db) {
  ipcMain.handle("employees:list", () => {
    const stmt = db.prepare(`
      SELECT
        e.id,
        e.name,
        e.cpf,
        e.role,
        e.admission_date as admissionDate,
        e.status,
        e.active,
        c.id as contractId,
        c.payment_type as paymentType,
        c.monthly_salary_cents as monthlySalaryCents,
        c.hourly_rate_cents as hourlyRateCents,
        c.weekly_hours as weeklyHours,
        c.daily_minutes as dailyMinutes,
        c.monthly_hours as monthlyHours,
        c.work_days as workDays,
        c.overtime_percent as overtimePercent,
        c.night_percent as nightPercent,
        c.start_date as contractStartDate,
        c.end_date as contractEndDate,
        c.active as contractActive
      FROM employees e
      LEFT JOIN employment_contracts c
        ON c.employee_id = e.id AND c.active = 1
      ORDER BY e.active DESC, e.status ASC, e.name ASC
    `);
    return stmt.all().map(mapEmployee);
  });

  ipcMain.handle("employees:upsertMany", (_evt, employees) => {
    if (!Array.isArray(employees)) {
      throw new Error("Lista de funcionários inválida.");
    }

    const insert = db.prepare(`
      INSERT INTO employees (id, name, cpf, role, admission_date, status, active)
      VALUES (@id, @name, @cpf, @role, @admissionDate, @status, @active)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        cpf=excluded.cpf,
        role=excluded.role,
        admission_date=excluded.admission_date,
        status=excluded.status,
        active=excluded.active
    `);

    const upsertContract = db.prepare(`
      INSERT INTO employment_contracts (
        id,
        employee_id,
        payment_type,
        monthly_salary_cents,
        hourly_rate_cents,
        weekly_hours,
        daily_minutes,
        monthly_hours,
        work_days,
        overtime_percent,
        night_percent,
        start_date,
        end_date,
        active
      )
      VALUES (
        @id,
        @employeeId,
        @paymentType,
        @monthlySalaryCents,
        @hourlyRateCents,
        @weeklyHours,
        @dailyMinutes,
        @monthlyHours,
        @workDays,
        @overtimePercent,
        @nightPercent,
        @startDate,
        @endDate,
        @active
      )
      ON CONFLICT(id) DO UPDATE SET
        payment_type=excluded.payment_type,
        monthly_salary_cents=excluded.monthly_salary_cents,
        hourly_rate_cents=excluded.hourly_rate_cents,
        weekly_hours=excluded.weekly_hours,
        daily_minutes=excluded.daily_minutes,
        monthly_hours=excluded.monthly_hours,
        work_days=excluded.work_days,
        overtime_percent=excluded.overtime_percent,
        night_percent=excluded.night_percent,
        start_date=excluded.start_date,
        end_date=excluded.end_date,
        active=excluded.active
    `);

    const tx = db.transaction((rows) => {
      for (const r of rows) {
        assertNonEmptyString(r?.id, "ID do funcionário");
        assertNonEmptyString(r?.name, "Nome do funcionário");

        const status = ["trial", "active", "inactive"].includes(r.status)
          ? r.status
          : r.active === false
            ? "inactive"
            : "active";

        insert.run({
          id: r.id,
          name: r.name.trim(),
          cpf: typeof r.cpf === "string" ? r.cpf.trim() : "",
          role: typeof r.role === "string" ? r.role.trim() : "",
          admissionDate: typeof r.admissionDate === "string" ? r.admissionDate : "",
          status,
          active: status === "inactive" ? 0 : 1,
        });

        if (r.contract) {
          assertNonEmptyString(r.contract.id, "ID do contrato");
          assertIsoDate(r.contract.startDate, "Data inicial do contrato");
          if (r.contract.paymentType !== "monthly" && r.contract.paymentType !== "hourly") {
            throw new Error("Tipo de pagamento inválido.");
          }
          assertNumber(r.contract.monthlySalaryCents, "Salário mensal");
          assertNumber(r.contract.hourlyRateCents, "Valor da hora");
          assertNumber(r.contract.weeklyHours, "Jornada semanal", 1);
          assertNumber(r.contract.dailyMinutes, "Jornada diária", 1);
          assertNumber(r.contract.monthlyHours, "Jornada mensal", 1);
          const workDays = serializeWorkDays(r.contract.workDays);
          assertNumber(r.contract.overtimePercent, "Percentual de hora extra");
          assertNumber(r.contract.nightPercent, "Percentual noturno");

          if (r.contract.active !== false) {
            db.prepare("UPDATE employment_contracts SET active = 0 WHERE employee_id = ? AND id <> ?").run(
              r.id,
              r.contract.id
            );
          }

          upsertContract.run({
            id: r.contract.id,
            employeeId: r.id,
            paymentType: r.contract.paymentType,
            monthlySalaryCents: Math.round(r.contract.monthlySalaryCents),
            hourlyRateCents: Math.round(r.contract.hourlyRateCents),
            weeklyHours: r.contract.weeklyHours,
            dailyMinutes: Math.round(r.contract.dailyMinutes),
            monthlyHours: r.contract.monthlyHours,
            workDays,
            overtimePercent: r.contract.overtimePercent,
            nightPercent: r.contract.nightPercent,
            startDate: r.contract.startDate,
            endDate: r.contract.endDate ?? null,
            active: r.contract.active === false ? 0 : 1,
          });

          recordSalaryHistoryIfChanged(db, r.id, r.contract);
        }

        appendAuditLog(db, {
          action: "upsert",
          entity: "employee",
          entityId: r.id,
          description: `Funcionário ${r.name.trim()} salvo.`,
          metadata: { status },
        });
      }
    });

    tx(employees);
    return true;
  });

  ipcMain.handle("employees:deleteIfUnused", (_evt, id) => {
    assertNonEmptyString(id, "ID do funcionário");
    const employee = db.prepare("SELECT id, name FROM employees WHERE id = ?").get(id);

    if (!employee) {
      return true;
    }

    const eventCount = db.prepare("SELECT COUNT(*) as count FROM time_events WHERE employee_id = ?").get(id).count;
    const adjustmentCount = db.prepare("SELECT COUNT(*) as count FROM time_adjustments WHERE employee_id = ?").get(id).count;

    if (eventCount > 0 || adjustmentCount > 0) {
      throw new Error("Funcionário possui registros de ponto. Inative para preservar o histórico.");
    }

    const tx = db.transaction(() => {
      db.prepare("DELETE FROM salary_history WHERE employee_id = ?").run(id);
      db.prepare("DELETE FROM hour_bank_compensations WHERE employee_id = ?").run(id);
      db.prepare("DELETE FROM employment_contracts WHERE employee_id = ?").run(id);
      db.prepare("DELETE FROM employees WHERE id = ?").run(id);
      appendAuditLog(db, {
        action: "delete",
        entity: "employee",
        entityId: id,
        description: `Funcionário ${employee.name} excluído.`,
      });
    });

    tx();
    return true;
  });
}

module.exports = { registerEmployeesIpc };
