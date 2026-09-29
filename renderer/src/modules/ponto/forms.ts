/* Schemas Zod + conversões formulário ↔ domínio.
   Os componentes de tab usam react-hook-form com estes schemas;
   o usePontoPageState só recebe objetos de domínio prontos. */

import { z } from "zod";
import type { Employee, EmploymentContract, Weekday } from "./pontoTypes";
import { toLocalDateKey } from "./pontoUtils";

/* ── Helpers de parse/máscara ── */

export function maskCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function parseDecimal(value: string, fallback = 0) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return fallback;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseMoneyToCents(value: string) {
  return Math.round(parseDecimal(value) * 100);
}

export function centsToInputValue(cents: number) {
  return (cents / 100).toFixed(2);
}

function newId() {
  return crypto.randomUUID();
}

/* ── Funcionário ── */

const weekdaySchema = z.custom<Weekday>(
  (v) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 6
);

export const employeeFormSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do funcionário."),
    cpf: z.string().refine(
      (v) => !v.trim() || v.replace(/\D/g, "").length === 11,
      "CPF incompleto — são 11 dígitos."
    ),
    role: z.string(),
    admissionDate: z.string(),
    status: z.enum(["trial", "active", "inactive"]),
    paymentType: z.enum(["monthly", "hourly"]),
    monthlySalary: z.string(),
    hourlyRate: z.string(),
    weeklyHours: z.string(),
    dailyMinutes: z.string(),
    monthlyHours: z.string(),
    workDays: z.array(weekdaySchema).min(1, "Selecione ao menos um dia de trabalho."),
    overtimePercent: z.string(),
    nightPercent: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.paymentType === "monthly" && parseMoneyToCents(v.monthlySalary) <= 0) {
      ctx.addIssue({ code: "custom", path: ["monthlySalary"], message: "Salário mensal deve ser maior que zero." });
    }
    if (v.paymentType === "hourly" && parseMoneyToCents(v.hourlyRate) <= 0) {
      ctx.addIssue({ code: "custom", path: ["hourlyRate"], message: "Valor da hora deve ser maior que zero." });
    }
  });

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const emptyEmployeeFormValues: EmployeeFormValues = {
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

export function employeeToFormValues(employee: Employee): EmployeeFormValues {
  return {
    name: employee.name,
    cpf: employee.cpf,
    role: employee.role,
    admissionDate: employee.admissionDate,
    status: employee.status,
    paymentType: employee.contract?.paymentType ?? "monthly",
    monthlySalary: employee.contract ? centsToInputValue(employee.contract.monthlySalaryCents) : "",
    hourlyRate: employee.contract ? centsToInputValue(employee.contract.hourlyRateCents) : "",
    weeklyHours: String(employee.contract?.weeklyHours ?? 44),
    dailyMinutes: String(employee.contract?.dailyMinutes ?? 480),
    monthlyHours: String(employee.contract?.monthlyHours ?? 220),
    workDays: employee.contract?.workDays ?? [1, 2, 3, 4, 5],
    overtimePercent: String(employee.contract?.overtimePercent ?? 50),
    nightPercent: String(employee.contract?.nightPercent ?? 20),
  };
}

export function buildEmployeeFromForm(form: EmployeeFormValues, existing?: Employee): Employee {
  const employeeId = existing?.id ?? newId();
  const contract: EmploymentContract = {
    id: existing?.contract?.id ?? newId(),
    employeeId,
    paymentType: form.paymentType,
    monthlySalaryCents: parseMoneyToCents(form.monthlySalary),
    hourlyRateCents: parseMoneyToCents(form.hourlyRate),
    weeklyHours: parseDecimal(form.weeklyHours, 44),
    dailyMinutes: Math.round(parseDecimal(form.dailyMinutes, 480)),
    monthlyHours: parseDecimal(form.monthlyHours, 220),
    workDays: [...form.workDays].sort((a, b) => a - b),
    overtimePercent: parseDecimal(form.overtimePercent, 50),
    nightPercent: parseDecimal(form.nightPercent, 20),
    startDate: form.admissionDate || toLocalDateKey(new Date()),
    endDate: null,
    active: true,
  };
  return {
    id: employeeId,
    name: form.name.trim(),
    cpf: form.cpf.trim(),
    role: form.role.trim(),
    admissionDate: form.admissionDate,
    status: form.status,
    active: form.status !== "inactive",
    contract,
  };
}

/* ── Ajuste manual de ponto ── */

export const adjustmentFormSchema = z.object({
  employeeId: z.string().min(1, "Selecione um funcionário."),
  workDate: z.string().min(1, "Informe a data."),
  time: z.string().min(1, "Informe a hora."),
  type: z.enum(["IN", "OUT"]),
  reason: z.string().trim().min(1, "Informe o motivo do ajuste."),
});

export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

/* ── Feriado ── */

export const holidayFormSchema = z.object({
  date: z.string().min(1, "Informe a data."),
  name: z.string().trim().min(1, "Informe o nome do feriado."),
  scope: z.enum(["national", "state", "city", "company"]),
});

export type HolidayFormValues = z.infer<typeof holidayFormSchema>;
