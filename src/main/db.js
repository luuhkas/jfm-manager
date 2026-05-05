const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const ALLOWED_TABLES = new Set([
  "employees", "employment_contracts", "time_events", "time_adjustments",
  "holidays", "month_closings", "audit_logs", "hour_bank_compensations",
  "salary_history", "work_orders", "app_settings",
]);

function ensureColumn(db, tableName, columnName, definition) {
  if (!ALLOWED_TABLES.has(tableName) || !/^\w+$/.test(columnName)) {
    throw new Error(`Invalid table/column: ${tableName}.${columnName}`);
  }
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function initializeDb(db) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      admission_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('trial','active','inactive')),
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS employment_contracts (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'monthly' CHECK(payment_type IN ('monthly','hourly')),
      monthly_salary_cents INTEGER NOT NULL DEFAULT 0,
      hourly_rate_cents INTEGER NOT NULL DEFAULT 0,
      weekly_hours REAL NOT NULL DEFAULT 44,
      daily_minutes INTEGER NOT NULL DEFAULT 480,
      monthly_hours REAL NOT NULL DEFAULT 220,
      work_days TEXT NOT NULL DEFAULT '1,2,3,4,5',
      overtime_percent REAL NOT NULL DEFAULT 50,
      night_percent REAL NOT NULL DEFAULT 20,
      start_date TEXT NOT NULL,
      end_date TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS time_events (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      work_date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN','OUT')),
      source TEXT NOT NULL DEFAULT 'manager',
      note TEXT,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS time_adjustments (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      work_date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN','OUT')),
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(event_id) REFERENCES time_events(id),
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'company' CHECK(scope IN ('national','state','city','company'))
    );

    CREATE TABLE IF NOT EXISTS month_closings (
      month_key TEXT PRIMARY KEY,
      closed_at TEXT NOT NULL,
      closed_by TEXT NOT NULL DEFAULT 'manager',
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_time_events_emp_date
      ON time_events(employee_id, work_date);

    CREATE INDEX IF NOT EXISTS idx_time_events_date
      ON time_events(work_date);

    CREATE INDEX IF NOT EXISTS idx_time_adjustments_emp_date
      ON time_adjustments(employee_id, work_date);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date_name
      ON holidays(date, name);

    CREATE INDEX IF NOT EXISTS idx_employment_contracts_emp_active
      ON employment_contracts(employee_id, active);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON audit_logs(created_at);

    CREATE TABLE IF NOT EXISTS hour_bank_compensations (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      month_key TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS salary_history (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      payment_type TEXT NOT NULL DEFAULT 'monthly',
      monthly_salary_cents INTEGER NOT NULL DEFAULT 0,
      hourly_rate_cents INTEGER NOT NULL DEFAULT 0,
      effective_from TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','in_progress','completed','cancelled')),
      employee_ids TEXT NOT NULL DEFAULT '[]',
      estimated_minutes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_hour_bank_emp
      ON hour_bank_compensations(employee_id, month_key);

    CREATE INDEX IF NOT EXISTS idx_salary_history_emp
      ON salary_history(employee_id, effective_from);

    CREATE INDEX IF NOT EXISTS idx_work_orders_status
      ON work_orders(status, created_at);
  `);

  ensureColumn(db, "employees", "cpf", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "employees", "role", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "employees", "admission_date", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "employees", "status", "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn(db, "employees", "active", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(
    db,
    "employment_contracts",
    "payment_type",
    "TEXT NOT NULL DEFAULT 'monthly' CHECK(payment_type IN ('monthly','hourly'))"
  );
  ensureColumn(db, "employment_contracts", "hourly_rate_cents", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "employment_contracts", "work_days", "TEXT NOT NULL DEFAULT '1,2,3,4,5'");

  return db;
}

function openDb(dbPath) {
  const dataDir = dbPath ? path.dirname(dbPath) : path.join(__dirname, "..", "..", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const resolvedDbPath = dbPath ?? path.join(dataDir, "jfm.sqlite");
  const db = new Database(resolvedDbPath);
  db.jfmPath = resolvedDbPath;
  return initializeDb(db);
}

module.exports = { initializeDb, openDb };
