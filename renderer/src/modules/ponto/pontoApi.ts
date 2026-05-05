import type {
  AuditLog,
  Employee,
  EsocialRemuneracao,
  Holiday,
  HourBankEntry,
  MonthClosing,
  SalaryHistoryEntry,
  TimeAdjustment,
  TimeEvent,
  WorkOrder,
} from "./pontoTypes";

export async function backupDatabase(): Promise<{ canceled: boolean; filePath?: string }> {
  return window.jfm.database.backup();
}

export async function restoreDatabase(): Promise<{ canceled: boolean }> {
  return window.jfm.database.restore();
}

export async function loadAuditByRange(startDate: string, endDate: string): Promise<AuditLog[]> {
  return window.jfm.audit.listByRange({ startDate, endDate });
}

export async function loadEmployees(): Promise<Employee[]> {
  return window.jfm.employees.list();
}

export async function upsertEmployees(employees: Employee[]): Promise<boolean> {
  return window.jfm.employees.upsertMany(employees);
}

export async function deleteEmployeeIfUnused(id: string): Promise<boolean> {
  return window.jfm.employees.deleteIfUnused(id);
}

export async function loadEventsByDate(workDate: string): Promise<TimeEvent[]> {
  return window.jfm.ponto.listByDate(workDate);
}

export async function loadEventsByRange(startDate: string, endDate: string): Promise<TimeEvent[]> {
  return window.jfm.ponto.listByRange({ startDate, endDate });
}

export async function addEvent(ev: TimeEvent): Promise<TimeEvent> {
  return window.jfm.ponto.addEvent(ev);
}

export async function deleteTimeEvent(id: string): Promise<boolean> {
  return window.jfm.ponto.deleteEvent(id);
}

export async function loadAdjustmentsByRange(
  startDate: string,
  endDate: string
): Promise<TimeAdjustment[]> {
  return window.jfm.ponto.listAdjustmentsByRange({ startDate, endDate });
}

export async function addAdjustment(adjustment: TimeAdjustment): Promise<TimeAdjustment> {
  return window.jfm.ponto.addAdjustment(adjustment);
}

export async function loadHolidaysByRange(startDate: string, endDate: string): Promise<Holiday[]> {
  return window.jfm.holidays.listByRange({ startDate, endDate });
}

export async function upsertHoliday(holiday: Holiday): Promise<Holiday> {
  return window.jfm.holidays.upsert(holiday);
}

export async function deleteHoliday(id: string): Promise<boolean> {
  return window.jfm.holidays.delete(id);
}

export async function loadMonthClosing(monthKey: string): Promise<MonthClosing | null> {
  return window.jfm.monthClosings.get(monthKey);
}

export async function closeMonth(closing: MonthClosing): Promise<MonthClosing> {
  return window.jfm.monthClosings.close(closing);
}

export async function reopenMonth(monthKey: string): Promise<boolean> {
  return window.jfm.monthClosings.reopen(monthKey);
}

// Banco de horas
export async function loadHourBankAll(): Promise<HourBankEntry[]> {
  return window.jfm.hourBank.listAll();
}

export async function loadHourBankByEmployee(employeeId: string): Promise<HourBankEntry[]> {
  return window.jfm.hourBank.listByEmployee(employeeId);
}

export async function addHourBankEntry(entry: HourBankEntry): Promise<HourBankEntry> {
  return window.jfm.hourBank.add(entry);
}

export async function deleteHourBankEntry(id: string): Promise<boolean> {
  return window.jfm.hourBank.delete(id);
}

// Work orders
export async function loadWorkOrders(filters?: { status?: string }): Promise<WorkOrder[]> {
  return window.jfm.workOrders.list(filters);
}

export async function upsertWorkOrder(wo: WorkOrder): Promise<WorkOrder> {
  return window.jfm.workOrders.upsert(wo);
}

export async function deleteWorkOrder(id: string): Promise<boolean> {
  return window.jfm.workOrders.delete(id);
}

export async function getNextWorkOrderNumber(): Promise<string> {
  return window.jfm.workOrders.nextNumber();
}

// Settings
export async function loadAllSettings(): Promise<Record<string, string>> {
  return window.jfm.settings.getAll();
}

export async function saveSetting(key: string, value: string): Promise<boolean> {
  return window.jfm.settings.set(key, value);
}

export async function saveSettings(entries: Record<string, string>): Promise<boolean> {
  return window.jfm.settings.setMany(entries);
}

// PDF
export async function generatePdf(payload: {
  html: string;
  filename: string;
}): Promise<{ success: boolean; canceled?: boolean; filePath?: string }> {
  return window.jfm.pdf.generate(payload);
}

// eSocial
export async function generateEsocialS1200(payload: {
  competencia: string;
  empregador: { cnpj: string; cpfResponsavel?: string; tpInsc?: string };
  remuneracoes: EsocialRemuneracao[];
}): Promise<{ success: boolean; canceled?: boolean; filePath?: string }> {
  return window.jfm.esocial.generateS1200(payload);
}

// Histórico de salário
export async function loadSalaryHistory(employeeId: string): Promise<SalaryHistoryEntry[]> {
  return window.jfm.salaryHistory.listByEmployee(employeeId);
}
