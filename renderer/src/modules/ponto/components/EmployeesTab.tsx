import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Employee, SalaryHistoryEntry, Weekday } from "../pontoTypes";
import { employeeStatusLabels, weekdayOptions } from "../pontoPageShared";
import {
  employeeFormSchema,
  employeeToFormValues,
  emptyEmployeeFormValues,
  maskCpf,
  type EmployeeFormValues,
} from "../forms";
import { formatCurrencyFromCents } from "../pontoUtils";

interface EmployeesTabProps {
  employees: Employee[];
  onSaveEmployee: (values: EmployeeFormValues, editingId: string | null) => Promise<boolean>;
  onToggleEmployeeActive: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => Promise<boolean>;
  onLoadSalaryHistory: (employeeId: string) => Promise<SalaryHistoryEntry[]>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

export function EmployeesTab({
  employees,
  onSaveEmployee,
  onToggleEmployeeActive,
  onDeleteEmployee,
  onLoadSalaryHistory,
}: EmployeesTabProps) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryEntry[] | null>(null);
  const [historyName, setHistoryName] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: emptyEmployeeFormValues,
  });

  const paymentType = watch("paymentType");
  const workDays = watch("workDays");

  function toggleWorkDay(day: Weekday) {
    const has = workDays.includes(day);
    setValue(
      "workDays",
      has ? workDays.filter((d) => d !== day) : [...workDays, day].sort((a, b) => a - b),
      { shouldValidate: true }
    );
  }

  function openNewForm() {
    setEditingId(null);
    reset(emptyEmployeeFormValues);
    setFormOpen(true);
  }

  function openEditForm(emp: Employee) {
    setEditingId(emp.id);
    reset(employeeToFormValues(emp));
    setFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    reset(emptyEmployeeFormValues);
    setFormOpen(false);
  }

  const submit = handleSubmit(async (values) => {
    const ok = await onSaveEmployee(values, editingId);
    if (ok) closeForm();
  });

  async function handleDelete(emp: Employee) {
    const deleted = await onDeleteEmployee(emp);
    if (deleted && editingId === emp.id) closeForm();
  }

  async function handleShowHistory(emp: Employee) {
    setLoadingHistory(true);
    try {
      const history = await onLoadSalaryHistory(emp.id);
      setSalaryHistory(history);
      setHistoryName(emp.name);
    } finally {
      setLoadingHistory(false);
    }
  }

  const filtered = employees.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()) || e.cpf.includes(search)
  );

  return (
    <>
      {salaryHistory ? (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Histórico de salário — {historyName}</h3>
              <button type="button" className="btn-sm" onClick={() => setSalaryHistory(null)}>Fechar</button>
            </div>
            {salaryHistory.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>Nenhuma alteração registrada.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Data vigência</th>
                    <th>Tipo</th>
                    <th>Salário/Hora</th>
                    <th>Registrado em</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.map((h) => (
                    <tr key={h.id}>
                      <td>{h.effectiveFrom}</td>
                      <td>{h.paymentType === "monthly" ? "Mensalista" : "Horista"}</td>
                      <td>
                        {h.paymentType === "monthly" ? formatCurrencyFromCents(h.monthlySalaryCents) : formatCurrencyFromCents(h.hourlyRateCents) + "/h"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                        {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Cabeçalho da lista ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <h2 className="section-title" style={{ margin: 0 }}>Funcionários {employees.length > 0 ? `(${employees.length})` : ""}</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {employees.length > 0 ? (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              style={{ width: 200 }}
            />
          ) : null}
          <button
            type="button"
            onClick={() => (formOpen ? closeForm() : openNewForm())}
            className={formOpen ? undefined : "btn-primary"}
          >
            {formOpen ? "Cancelar" : "+ Novo funcionário"}
          </button>
        </div>
      </div>

      {formOpen ? (
        <form
          onSubmit={submit}
          noValidate
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            alignItems: "start",
            marginBottom: 24,
            padding: 18,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--surface-soft)",
          }}
        >
          <div className="form-section-title">{editingId ? "Editando funcionário" : "Novo funcionário"}</div>

          <label className="field-label">
            Nome
            <input {...register("name")} placeholder="Nome completo" aria-invalid={!!errors.name} />
            <FieldError message={errors.name?.message} />
          </label>

          <label className="field-label">
            CPF
            <input
              {...register("cpf", {
                onChange: (e) => setValue("cpf", maskCpf(e.target.value)),
              })}
              placeholder="000.000.000-00"
              aria-invalid={!!errors.cpf}
            />
            <FieldError message={errors.cpf?.message} />
          </label>

          <label className="field-label">
            Cargo
            <input {...register("role")} placeholder="Mecânico" />
          </label>

          <label className="field-label">
            Admissão
            <input type="date" {...register("admissionDate")} />
          </label>

          <label className="field-label">
            Status
            <select {...register("status")}>
              <option value="trial">{employeeStatusLabels.trial}</option>
              <option value="active">{employeeStatusLabels.active}</option>
              <option value="inactive">{employeeStatusLabels.inactive}</option>
            </select>
          </label>

          <div className="form-section-title">Contrato</div>

          <label className="field-label">
            Tipo
            <select {...register("paymentType")}>
              <option value="monthly">Mensalista</option>
              <option value="hourly">Horista</option>
            </select>
          </label>

          <label className="field-label">
            Salário mensal
            <input
              type="number"
              min="0"
              step="0.01"
              {...register("monthlySalary")}
              placeholder="2500.00"
              disabled={paymentType !== "monthly"}
              aria-invalid={!!errors.monthlySalary}
            />
            <FieldError message={errors.monthlySalary?.message} />
          </label>

          <label className="field-label">
            Valor da hora
            <input
              type="number"
              min="0"
              step="0.01"
              {...register("hourlyRate")}
              placeholder="15.00"
              disabled={paymentType !== "hourly"}
              aria-invalid={!!errors.hourlyRate}
            />
            <FieldError message={errors.hourlyRate?.message} />
          </label>

          <details className="advanced-fields">
            <summary>Regras avançadas de jornada</summary>
            <div className="advanced-fields-grid">
              <label className="field-label">
                Jornada semanal (h)
                <input type="number" min="1" step="0.5" {...register("weeklyHours")} />
              </label>
              <label className="field-label">
                Minutos por dia
                <input type="number" min="1" step="1" {...register("dailyMinutes")} />
              </label>
              <label className="field-label">
                Horas mensais (h)
                <input type="number" min="1" step="0.5" {...register("monthlyHours")} />
              </label>
              <fieldset style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 10 }}>
                <legend style={{ fontWeight: 600 }}>Dias de trabalho</legend>
                {weekdayOptions.map((day) => (
                  <label key={day.value} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={workDays.includes(day.value)} onChange={() => toggleWorkDay(day.value)} />
                    {day.label}
                  </label>
                ))}
                <FieldError message={errors.workDays?.message} />
              </fieldset>
              <label className="field-label">
                Extra %
                <input type="number" min="0" step="1" {...register("overtimePercent")} />
              </label>
              <label className="field-label">
                Noturno %
                <input type="number" min="0" step="1" {...register("nightPercent")} />
              </label>
            </div>
          </details>

          <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1" }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {editingId ? "Salvar alterações" : "Cadastrar funcionário"}
            </button>
            <button type="button" className="btn-ghost" onClick={closeForm}>Cancelar</button>
          </div>
        </form>
      ) : null}

      {employees.length > 0 ? (
        <section>
          {filtered.length === 0 ? (
            <div style={{ color: "var(--muted)", padding: 16 }}>Nenhum funcionário encontrado para "{search}".</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    padding: "12px 14px",
                    background: "var(--surface)",
                    opacity: emp.active ? 1 : 0.55,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 700 }}>{emp.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                      {emp.role || "Cargo não informado"} · {employeeStatusLabels[emp.status]}
                      {emp.admissionDate ? ` · Admissão: ${new Date(emp.admissionDate + "T12:00:00").toLocaleDateString("pt-BR")}` : ""}
                    </div>
                    {emp.contract ? (
                      <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                        {emp.contract.paymentType === "monthly"
                          ? `Mensalista · ${formatCurrencyFromCents(emp.contract.monthlySalaryCents)}`
                          : `Horista · ${formatCurrencyFromCents(emp.contract.hourlyRateCents)}/h`}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => openEditForm(emp)}>Editar</button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => handleShowHistory(emp)}
                      disabled={loadingHistory}
                    >
                      Histórico
                    </button>
                    <button type="button" className="btn-ghost btn-sm" onClick={() => onToggleEmployeeActive(emp)}>
                      {emp.active ? "Inativar" : "Reativar"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(emp)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
