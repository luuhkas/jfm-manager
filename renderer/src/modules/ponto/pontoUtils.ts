import type { Employee, EmploymentContract, Holiday, PayrollSummary, TimeEvent, Weekday, WorkdaySummary } from "./pontoTypes";
import { calculateIrrfCents, calculateProgressiveInssCents, getLaborRulesForDate } from "./laborRules";

const FALLBACK_RULES_DATE = "2026-01-01";

function getHourlyCents(contract: EmploymentContract | null) {
  if (!contract) return 0;
  if (contract.paymentType === "hourly") return contract.hourlyRateCents;
  return contract.monthlySalaryCents / contract.monthlyHours;
}

export function calculateWorkedMs(events: TimeEvent[]): number {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalMs = 0;
  let lastIn: Date | null = null;

  for (const ev of sorted) {
    const t = new Date(ev.timestamp);

    if (ev.type === "IN") {
      lastIn = t;
    }

    if (ev.type === 'OUT' && lastIn) {
      totalMs += t.getTime() - lastIn.getTime();
      lastIn = null;
    }
  }

  return totalMs;
}

export function calculateNightWorkedMs(events: TimeEvent[]): number {
  const rules = getLaborRulesForDate(events[0]?.workDate ?? FALLBACK_RULES_DATE);
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalMs = 0;
  let lastIn: Date | null = null;

  for (const ev of sorted) {
    const current = new Date(ev.timestamp);

    if (ev.type === "IN") {
      lastIn = current;
    }

    if (ev.type === "OUT" && lastIn) {
      totalMs += calculateNightOverlapMs(lastIn, current, rules.nightStartHour, rules.nightEndHour);
      lastIn = null;
    }
  }

  return totalMs;
}

function calculateNightOverlapMs(start: Date, end: Date, nightStartHour: number, nightEndHour: number): number {
  if (end <= start) return 0;

  let totalMs = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  while (cursor < end) {
    const nightStart = new Date(cursor);
    nightStart.setHours(nightStartHour, 0, 0, 0);

    const nightEnd = new Date(cursor);
    nightEnd.setDate(nightEnd.getDate() + 1);
    nightEnd.setHours(nightEndHour, 0, 0, 0);

    const overlapStart = Math.max(start.getTime(), nightStart.getTime());
    const overlapEnd = Math.min(end.getTime(), nightEnd.getTime());

    if (overlapEnd > overlapStart) {
      totalMs += overlapEnd - overlapStart;
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return totalMs;
}

export function formatWorked(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  return formatMinutes(totalMinutes);
}

export function formatMinutes(totalMinutes: number): string {
  const normalized = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;

  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function formatSignedMinutes(totalMinutes: number): string {
  const sign = totalMinutes > 0 ? "+" : totalMinutes < 0 ? "-" : "";
  return `${sign}${formatMinutes(Math.abs(totalMinutes))}`;
}

export function formatCurrencyFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function centsToDecimal(cents: number) {
  return (cents / 100).toFixed(2);
}

export function buildPayrollCsv(
  monthKey: string,
  employees: Employee[],
  payrollByEmployee: Map<string, PayrollSummary>
) {
  const headers = [
    "Competencia",
    "Funcionario",
    "Previsto min",
    "Trabalhado min",
    "Extra min",
    "Atraso/falta min",
    "Saldo banco min",
    "Noturno min",
    "DSR",
    "Bruto",
    "Desconto faltas",
    "INSS",
    "IRRF",
    "Liquido estimado",
    "FGTS empregador",
    "Custo estimado",
  ];

  const rows = employees.map((employee) => {
    const payroll = payrollByEmployee.get(employee.id);

    return [
      monthKey,
      employee.name,
      payroll?.expectedMinutes ?? 0,
      payroll?.workedMinutes ?? 0,
      payroll?.overtimeMinutes ?? 0,
      payroll?.missingMinutes ?? 0,
      payroll?.balanceMinutes ?? 0,
      payroll?.nightMinutes ?? 0,
      centsToDecimal(payroll?.dsrCents ?? 0),
      centsToDecimal(payroll?.grossCents ?? 0),
      centsToDecimal(payroll?.missingDiscountCents ?? 0),
      centsToDecimal(payroll?.inssDiscountCents ?? 0),
      centsToDecimal(payroll?.irrfDiscountCents ?? 0),
      centsToDecimal(payroll?.netEstimateCents ?? 0),
      centsToDecimal(payroll?.fgtsEmployerCents ?? 0),
      centsToDecimal(payroll?.employerCostEstimateCents ?? 0),
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
}

export function getMonthDates(monthKey: string): string[] {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return [];

  const dates: string[] = [];
  const cursor = new Date(year, month - 1, 1);

  while (cursor.getMonth() === month - 1) {
    dates.push(toLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isWeekday(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  return weekday >= 1 && weekday <= 5;
}

export function getWeekday(dateKey: string): Weekday {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).getDay() as Weekday;
}

export function isScheduledWorkday(dateKey: string, contract: EmploymentContract | null) {
  if (!contract) return false;
  return contract.workDays.includes(getWeekday(dateKey));
}

export function isHoliday(dateKey: string, holidays: Holiday[]) {
  return holidays.some((holiday) => holiday.date === dateKey);
}

function countPaidRestDays(dates: string[], contract: EmploymentContract, holidays: Holiday[]) {
  return dates.filter((dateKey) => !isScheduledWorkday(dateKey, contract) || isHoliday(dateKey, holidays)).length;
}

export function getStatus(events: TimeEvent[]): "Trabalhando" | "Fora" {
  if (events.length === 0) return "Fora";

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const last = sorted[sorted.length - 1];

  return last.type === "IN" ? "Trabalhando" : "Fora";
}

export function summarizeWorkday(
  events: TimeEvent[],
  contract: EmploymentContract | null,
  expectedMinutesOverride?: number
): WorkdaySummary {
  const workedMs = calculateWorkedMs(events);
  const rules = getLaborRulesForDate(events[0]?.workDate ?? FALLBACK_RULES_DATE);
  const workedMinutes = Math.floor(workedMs / 60000);
  const expectedMinutes = expectedMinutesOverride ?? contract?.dailyMinutes ?? 0;
  const differenceMinutes = workedMinutes - expectedMinutes;
  const overtimeMinutes = differenceMinutes > rules.dailyToleranceMinutes ? differenceMinutes : 0;
  const missingMinutes = differenceMinutes < -rules.dailyToleranceMinutes ? Math.abs(differenceMinutes) : 0;
  const normalMinutes = expectedMinutes > 0 ? Math.min(workedMinutes, expectedMinutes) : 0;
  const nightClockMinutes = Math.floor(calculateNightWorkedMs(events) / 60000);
  const nightMinutes = Math.floor(nightClockMinutes * rules.nightHourFactor);
  const hourlyCents = getHourlyCents(contract);
  const overtimePercent = Math.max(contract?.overtimePercent ?? rules.overtimeMinimumPercent, rules.overtimeMinimumPercent);
  const nightPercent = Math.max(contract?.nightPercent ?? rules.nightMinimumPercent, rules.nightMinimumPercent);
  const overtimeRate = 1 + overtimePercent / 100;
  const nightRate = nightPercent / 100;

  return {
    workedMs,
    workedMinutes,
    expectedMinutes,
    normalMinutes,
    overtimeMinutes,
    missingMinutes,
    balanceMinutes: overtimeMinutes - missingMinutes,
    nightMinutes,
    grossDayCents: Math.round((hourlyCents / 60) * normalMinutes),
    overtimeCents: Math.round((hourlyCents / 60) * overtimeMinutes * overtimeRate),
    nightBonusCents: Math.round((hourlyCents / 60) * nightMinutes * nightRate),
  };
}

export function summarizePayrollMonth(
  dates: string[],
  events: TimeEvent[],
  contract: EmploymentContract | null,
  holidays: Holiday[] = []
): PayrollSummary {
  const initial: PayrollSummary = {
    expectedMinutes: 0,
    workedMinutes: 0,
    workedDays: 0,
    normalMinutes: 0,
    overtimeMinutes: 0,
    missingMinutes: 0,
    balanceMinutes: 0,
    nightMinutes: 0,
    baseSalaryCents: contract?.paymentType === "monthly" ? contract.monthlySalaryCents : 0,
    normalWorkedCents: 0,
    overtimeCents: 0,
    nightBonusCents: 0,
    dsrCents: 0,
    fgtsEmployerCents: 0,
    inssDiscountCents: 0,
    irrfDiscountCents: 0,
    missingDiscountCents: 0,
    grossCents: 0,
    netEstimateCents: 0,
    employerCostEstimateCents: 0,
  };

  if (!contract) return initial;

  const hourlyCents = getHourlyCents(contract);
  const rules = getLaborRulesForDate(dates[0] ?? FALLBACK_RULES_DATE);

  for (const dateKey of dates) {
    const expectedMinutes =
      isScheduledWorkday(dateKey, contract) && !isHoliday(dateKey, holidays) ? contract.dailyMinutes : 0;
    const dayEvents = events.filter((event) => event.workDate === dateKey);
    const summary = summarizeWorkday(dayEvents, contract, expectedMinutes);

    initial.expectedMinutes += summary.expectedMinutes;
    initial.workedMinutes += summary.workedMinutes;
    if (summary.workedMinutes > 0) initial.workedDays += 1;
    initial.normalMinutes += summary.normalMinutes;
    initial.overtimeMinutes += summary.overtimeMinutes;
    initial.missingMinutes += summary.missingMinutes;
    initial.balanceMinutes += summary.overtimeMinutes - summary.missingMinutes;
    initial.nightMinutes += summary.nightMinutes;
    initial.normalWorkedCents += summary.grossDayCents;
    initial.overtimeCents += summary.overtimeCents;
    initial.nightBonusCents += summary.nightBonusCents;
  }

  if (contract.paymentType === "hourly") {
    const restDays = countPaidRestDays(dates, contract, holidays);
    const dsrBase = initial.normalWorkedCents + initial.overtimeCents + initial.nightBonusCents;
    initial.dsrCents =
      initial.workedDays > 0 ? Math.round((dsrBase / initial.workedDays) * restDays) : 0;
  }

  if (contract.paymentType === "hourly") {
    initial.missingDiscountCents = 0;
    initial.grossCents = initial.normalWorkedCents + initial.overtimeCents + initial.nightBonusCents + initial.dsrCents;
    initial.inssDiscountCents = calculateProgressiveInssCents(initial.grossCents, rules);
    initial.irrfDiscountCents = calculateIrrfCents(initial.grossCents, initial.inssDiscountCents, rules);
    initial.fgtsEmployerCents = Math.round(initial.grossCents * (rules.fgtsEmployerPercent / 100));
    initial.netEstimateCents = Math.max(0, initial.grossCents - initial.inssDiscountCents - initial.irrfDiscountCents);
    initial.employerCostEstimateCents = initial.grossCents + initial.fgtsEmployerCents;
    return initial;
  }

  initial.missingDiscountCents = Math.round((hourlyCents / 60) * initial.missingMinutes);
  initial.grossCents = initial.baseSalaryCents + initial.overtimeCents + initial.nightBonusCents;
  initial.inssDiscountCents = calculateProgressiveInssCents(
    Math.max(0, initial.grossCents - initial.missingDiscountCents),
    rules
  );
  initial.irrfDiscountCents = calculateIrrfCents(
    Math.max(0, initial.grossCents - initial.missingDiscountCents),
    initial.inssDiscountCents,
    rules
  );
  initial.fgtsEmployerCents = Math.round(Math.max(0, initial.grossCents - initial.missingDiscountCents) * (rules.fgtsEmployerPercent / 100));
  initial.netEstimateCents = Math.max(
    0,
    initial.grossCents - initial.missingDiscountCents - initial.inssDiscountCents - initial.irrfDiscountCents
  );
  initial.employerCostEstimateCents = initial.grossCents + initial.fgtsEmployerCents;

  return initial;
}
