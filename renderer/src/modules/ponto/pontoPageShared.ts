import type { EmployeeStatus, Holiday, Weekday, WorkOrderStatus } from "./pontoTypes";

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
