const assert = require("node:assert/strict");
const test = require("node:test");
const Database = require("better-sqlite3");
const { initializeDb } = require("../src/main/db");
const { registerAuditIpc } = require("../src/main/ipc/audit");
const { registerEmployeesIpc } = require("../src/main/ipc/employees");
const { registerHolidaysIpc } = require("../src/main/ipc/holidays");
const { registerMonthClosingsIpc } = require("../src/main/ipc/monthClosings");
const { registerPontoIpc } = require("../src/main/ipc/ponto");

function createHarness() {
  const db = initializeDb(new Database(":memory:"));
  const handlers = new Map();
  const ipcMain = {
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
  };

  registerEmployeesIpc(ipcMain, db);
  registerAuditIpc(ipcMain, db);
  registerPontoIpc(ipcMain, db);
  registerHolidaysIpc(ipcMain, db);
  registerMonthClosingsIpc(ipcMain, db);

  return {
    db,
    invoke(channel, payload) {
      const handler = handlers.get(channel);
      assert.ok(handler, `Handler ${channel} nao registrado`);
      return handler(null, payload);
    },
  };
}

function employeeFixture(active = true) {
  return {
    id: "employee-1",
    name: "Joao Silva",
    cpf: "000.000.000-00",
    role: "Mecanico",
    admissionDate: "2026-04-01",
    status: active ? "active" : "inactive",
    active,
    contract: {
      id: "contract-1",
      employeeId: "employee-1",
      paymentType: "monthly",
      monthlySalaryCents: 220000,
      hourlyRateCents: 0,
      weeklyHours: 44,
      dailyMinutes: 480,
      monthlyHours: 220,
      workDays: [1, 2, 3, 4, 5],
      overtimePercent: 50,
      nightPercent: 20,
      startDate: "2026-04-01",
      endDate: null,
      active: true,
    },
  };
}

test("employees:list retorna funcionario com contrato ativo normalizado", () => {
  const app = createHarness();

  app.invoke("employees:upsertMany", [employeeFixture()]);
  const employees = app.invoke("employees:list");

  assert.equal(employees.length, 1);
  assert.equal(employees[0].name, "Joao Silva");
  assert.equal(employees[0].active, true);
  assert.equal(employees[0].status, "active");
  assert.deepEqual(employees[0].contract.workDays, [1, 2, 3, 4, 5]);
});

test("ponto:addEvent exige alternancia de entrada e saida", () => {
  const app = createHarness();
  app.invoke("employees:upsertMany", [employeeFixture()]);

  app.invoke("ponto:addEvent", {
    id: "event-1",
    employeeId: "employee-1",
    timestamp: "2026-04-01T08:00:00-03:00",
    workDate: "2026-04-01",
    type: "IN",
  });

  assert.throws(
    () =>
      app.invoke("ponto:addEvent", {
        id: "event-2",
        employeeId: "employee-1",
        timestamp: "2026-04-01T09:00:00-03:00",
        workDate: "2026-04-01",
        type: "IN",
      }),
    /Marcação repetida/
  );

  app.invoke("ponto:addEvent", {
    id: "event-3",
    employeeId: "employee-1",
    timestamp: "2026-04-01T12:00:00-03:00",
    workDate: "2026-04-01",
    type: "OUT",
  });

  const events = app.invoke("ponto:listByDate", "2026-04-01");
  assert.deepEqual(
    events.map((event) => event.type),
    ["IN", "OUT"]
  );
});

test("ponto:addAdjustment insere evento auditavel sem quebrar a ordem do dia", () => {
  const app = createHarness();
  app.invoke("employees:upsertMany", [employeeFixture()]);
  app.invoke("ponto:addEvent", {
    id: "event-1",
    employeeId: "employee-1",
    timestamp: "2026-04-01T08:00:00-03:00",
    workDate: "2026-04-01",
    type: "IN",
  });
  app.invoke("ponto:addEvent", {
    id: "event-2",
    employeeId: "employee-1",
    timestamp: "2026-04-01T12:00:00-03:00",
    workDate: "2026-04-01",
    type: "OUT",
  });

  const adjustment = app.invoke("ponto:addAdjustment", {
    id: "adjustment-1",
    eventId: "event-3",
    employeeId: "employee-1",
    timestamp: "2026-04-01T13:00:00-03:00",
    workDate: "2026-04-01",
    type: "IN",
    reason: "Retorno do almoco",
    createdAt: "2026-04-01T13:01:00-03:00",
  });

  assert.equal(adjustment.createdAt, "2026-04-01T13:01:00-03:00");
  assert.throws(
    () =>
      app.invoke("ponto:addAdjustment", {
        id: "adjustment-2",
        eventId: "event-4",
        employeeId: "employee-1",
        timestamp: "2026-04-01T13:30:00-03:00",
        workDate: "2026-04-01",
        type: "IN",
        reason: "Duplicado",
      }),
    /alternância/
  );
});

test("holidays:upsert, listByRange e delete mantem feriados por periodo", () => {
  const app = createHarness();

  app.invoke("holidays:upsert", {
    id: "holiday-1",
    date: "2026-04-21",
    name: "Tiradentes",
    scope: "national",
  });

  assert.equal(
    app.invoke("holidays:listByRange", {
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    }).length,
    1
  );

  app.invoke("holidays:delete", "holiday-1");

  assert.equal(
    app.invoke("holidays:listByRange", {
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    }).length,
    0
  );
});

test("competencia fechada bloqueia alteracoes de ponto e feriados", () => {
  const app = createHarness();
  app.invoke("employees:upsertMany", [employeeFixture()]);

  const closing = app.invoke("monthClosings:close", {
    monthKey: "2026-04",
    closedAt: "2026-05-01T10:00:00-03:00",
    closedBy: "manager",
    note: "Conferido",
  });

  assert.equal(closing.monthKey, "2026-04");
  assert.equal(app.invoke("monthClosings:get", "2026-04").note, "Conferido");

  assert.throws(
    () =>
      app.invoke("ponto:addEvent", {
        id: "event-closed-1",
        employeeId: "employee-1",
        timestamp: "2026-04-01T08:00:00-03:00",
        workDate: "2026-04-01",
        type: "IN",
      }),
    /Competência fechada/
  );

  assert.throws(
    () =>
      app.invoke("holidays:upsert", {
        id: "holiday-closed-1",
        date: "2026-04-21",
        name: "Tiradentes",
        scope: "national",
      }),
    /Competência fechada/
  );

  app.invoke("monthClosings:reopen", "2026-04");
  assert.equal(app.invoke("monthClosings:get", "2026-04"), null);

  app.invoke("ponto:addEvent", {
    id: "event-open-1",
    employeeId: "employee-1",
    timestamp: "2026-04-01T08:00:00-03:00",
    workDate: "2026-04-01",
    type: "IN",
  });

  assert.equal(app.invoke("ponto:listByDate", "2026-04-01").length, 1);
});

test("audit:listByRange retorna historico de alteracoes", () => {
  const app = createHarness();
  app.invoke("employees:upsertMany", [employeeFixture()]);

  const today = new Date();
  const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const endDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

  const logs = app.invoke("audit:listByRange", { startDate, endDate });

  assert.equal(logs.length, 1);
  assert.equal(logs[0].entity, "employee");
  assert.match(logs[0].description, /Funcionário/);
});

test("employees:deleteIfUnused remove apenas funcionario sem ponto", () => {
  const app = createHarness();
  app.invoke("employees:upsertMany", [employeeFixture()]);

  app.invoke("employees:deleteIfUnused", "employee-1");
  assert.equal(app.invoke("employees:list").length, 0);

  app.invoke("employees:upsertMany", [employeeFixture()]);
  app.invoke("ponto:addEvent", {
    id: "event-delete-blocked",
    employeeId: "employee-1",
    timestamp: "2026-04-01T08:00:00-03:00",
    workDate: "2026-04-01",
    type: "IN",
  });

  assert.throws(() => app.invoke("employees:deleteIfUnused", "employee-1"), /possui registros de ponto/);
});
