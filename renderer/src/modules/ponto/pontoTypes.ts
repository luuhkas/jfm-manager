export type TimeEventType = "IN" | "OUT";
export type PaymentType = "monthly" | "hourly";
export type EmployeeStatus = "trial" | "active" | "inactive";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TimeEvent {
  id: string;
  employeeId: string;
  timestamp: string;
  workDate: string;
  type: TimeEventType;
  source?: string;
  note?: string | null;
}

export interface Employee {
  id: string;
  name: string;
  cpf: string;
  role: string;
  admissionDate: string;
  status: EmployeeStatus;
  active: boolean;
  contract: EmploymentContract | null;
}

export interface EmploymentContract {
  id: string;
  employeeId: string;
  paymentType: PaymentType;
  monthlySalaryCents: number;
  hourlyRateCents: number;
  weeklyHours: number;
  dailyMinutes: number;
  monthlyHours: number;
  workDays: Weekday[];
  overtimePercent: number;
  nightPercent: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface WorkdaySummary {
  workedMs: number;
  workedMinutes: number;
  expectedMinutes: number;
  normalMinutes: number;
  overtimeMinutes: number;
  missingMinutes: number;
  balanceMinutes: number;
  nightMinutes: number;
  grossDayCents: number;
  overtimeCents: number;
  nightBonusCents: number;
}

export interface TimeAdjustment {
  id: string;
  eventId: string;
  employeeId: string;
  timestamp: string;
  workDate: string;
  type: TimeEventType;
  reason: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  scope: "national" | "state" | "city" | "company";
}

export interface MonthClosing {
  monthKey: string;
  closedAt: string;
  closedBy: string;
  note: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  description: string;
  createdAt: string;
  metadata: string;
}

export interface HourBankEntry {
  id: string;
  employeeId: string;
  employeeName?: string;
  monthKey: string;
  minutes: number;
  note: string;
  createdAt: string;
}

export interface SalaryHistoryEntry {
  id: string;
  employeeId: string;
  paymentType: PaymentType;
  monthlySalaryCents: number;
  hourlyRateCents: number;
  effectiveFrom: string;
  note: string;
  createdAt: string;
}

export type WorkOrderStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface WorkOrder {
  id: string;
  number: string;
  clientName: string;
  description: string;
  status: WorkOrderStatus;
  employeeIds: string[];
  estimatedMinutes: number;
  createdAt: string;
  completedAt: string | null;
  note: string;
}

export interface AppSettings {
  theme?: "dark" | "light" | "system";
  autoBackupEnabled?: string;
  autoBackupDir?: string;
  companyName?: string;
  companyCnpj?: string;
  companyCpfResponsavel?: string;
}

export interface EsocialRemuneracao {
  cpf: string;
  nis?: string;
  nome: string;
  salarioBrutoCents: number;
  extraCents: number;
  noturnoCents: number;
  dsrCents: number;
  inssCents: number;
  irrfCents: number;
  diasTrabalhados: number;
}

export interface PayrollSummary {
  expectedMinutes: number;
  workedMinutes: number;
  workedDays: number;
  normalMinutes: number;
  overtimeMinutes: number;
  missingMinutes: number;
  balanceMinutes: number;
  nightMinutes: number;
  baseSalaryCents: number;
  normalWorkedCents: number;
  overtimeCents: number;
  nightBonusCents: number;
  dsrCents: number;
  fgtsEmployerCents: number;
  inssDiscountCents: number;
  irrfDiscountCents: number;
  missingDiscountCents: number;
  grossCents: number;
  netEstimateCents: number;
  employerCostEstimateCents: number;
}
