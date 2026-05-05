import type { EmployeeStatus, Holiday, PaymentType, Weekday, WorkOrderStatus } from "./pontoTypes";

export interface EmployeeFormState {
  name: string;
  cpf: string;
  role: string;
  admissionDate: string;
  status: EmployeeStatus;
  paymentType: PaymentType;
  monthlySalary: string;
  hourlyRate: string;
  weeklyHours: string;
  dailyMinutes: string;
  monthlyHours: string;
  workDays: Weekday[];
  overtimePercent: string;
  nightPercent: string;
}

export interface AdjustmentFormState {
  employeeId: string;
  workDate: string;
  time: string;
  type: "IN" | "OUT";
  reason: string;
}

export interface HolidayFormState {
  date: string;
  name: string;
  scope: Holiday["scope"];
}

export interface WorkOrderFormState {
  number: string;
  clientName: string;
  description: string;
  status: WorkOrderStatus;
  employeeIds: string[];
  estimatedMinutes: string;
  note: string;
}

export type TabKey =
  | "today"
  | "employees"
  | "closing"
  | "bank"
  | "orders"
  | "settings";

export const emptyEmployeeForm: EmployeeFormState = {
  name: "",
  cpf: "",
  role: "",
  admissionDate: "",
  status: "active",
  paymentType: "monthly",
  monthlySalary: "",
  hourlyRate: "",
  weeklyHours: "44",
  dailyMinutes: "480",
  monthlyHours: "220",
  workDays: [1, 2, 3, 4, 5],
  overtimePercent: "50",
  nightPercent: "20",
};

export const emptyWorkOrderForm: WorkOrderFormState = {
  number: "",
  clientName: "",
  description: "",
  status: "open",
  employeeIds: [],
  estimatedMinutes: "0",
  note: "",
};

export const weekdayOptions: Array<{ value: Weekday; label: string }> = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export const holidayScopeLabels: Record<Holiday["scope"], string> = {
  national: "Nacional",
  state: "Estadual",
  city: "Municipal",
  company: "Empresa",
};

export const timeEventTypeLabels: Record<"IN" | "OUT", string> = {
  IN: "Entrada",
  OUT: "Saída",
};

export const employeeStatusLabels: Record<EmployeeStatus, string> = {
  trial: "Experiência",
  active: "Ativo",
  inactive: "Inativo",
};

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "today", label: "Hoje" },
  { key: "employees", label: "Funcionários" },
  { key: "closing", label: "Fechamento" },
  { key: "bank", label: "Banco de Horas" },
  { key: "orders", label: "Ordens de Serviço" },
  { key: "settings", label: "Configurações" },
];
