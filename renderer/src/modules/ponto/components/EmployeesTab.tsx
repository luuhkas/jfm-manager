import { useState } from "react";
import type { FormEvent } from "react";
import type { Employee, PaymentType, SalaryHistoryEntry, Weekday } from "../pontoTypes";
import type { EmployeeFormState } from "../pontoPageShared";
import { employeeStatusLabels, weekdayOptions } from "../pontoPageShared";
import { formatCurrencyFromCents } from "../pontoUtils";

interface EmployeesTabProps {
  employeeForm: EmployeeFormState;
  editingEmployeeId: string | null;
  employees: Employee[];
  onSaveEmployee: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (field: keyof EmployeeFormState, value: string) => void;
  onToggleWorkDay: (day: Weekday) => void;
  onResetEmployeeForm: () => void;
  onEditEmployee: (employee: Employee) => void;
  onToggleEmployeeActive: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
  onLoadSalaryHistory: (employeeId: string) => Promise<SalaryHistoryEntry[]>;
}

export function EmployeesTab({
  employeeForm,
  editingEmployeeId,
  employees,
  onSaveEmployee,
  onUpdateForm,
  onToggleWorkDay,
  onResetEmployeeForm,
  onEditEmployee,
  onToggleEmployeeActive,
  onDeleteEmployee,
  onLoadSalaryHistory,
}: EmployeesTabProps) {
  const [search, setSearch] = useState("");
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryEntry[] | null>(null);
  const [historyName, setHistoryName] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

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
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Histórico de salário — {historyName}</h3>
              <button type="button" onClick={() => setSalaryHistory(null)} style={{ padding: "4px 10px" }}>Fechar</button>
            </div>
            {salaryHistory.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>Nenhuma alteração registrada.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Data vigência", "Tipo", "Salário/Hora", "Registrado em"].map((h) => (
                      <th key={h} style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: "6px 8px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.map((h) => (
                    <tr key={h.id}>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: "6px 8px" }}>{h.effectiveFrom}</td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: "6px 8px" }}>{h.paymentType === "monthly" ? "Mensalista" : "Horista"}</td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: "6px 8px" }}>
                        {h.paymentType === "monthly" ? formatCurrencyFromCents(h.monthlySalaryCents) : formatCurrencyFromCents(h.hourlyRateCents) + "/h"}
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: "6px 8px", color: "var(--muted)", fontSize: "0.82rem" }}>
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

      <form
        onSubmit={onSaveEmployee}
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          alignItems: "end",
          marginBottom: 24,
          padding: 18,
          border: "1px solid var(--border)",
          borderRadius: 10,
          background: "var(--surface-soft)",
        }}
      >
        <div className="form-section-title">{editingEmployeeId ? "Editando funcionário" : "Novo funcionário"}</div>

        <label className="field-label">
          Nome
          <input
            value={employeeForm.name}
            onChange={(e) => onUpdateForm("name", e.target.value)}
            placeholder="Nome completo"
          />
        </label>

        <label className="field-label">
          CPF
          <input
            value={employeeForm.cpf}
            onChange={(e) => onUpdateForm("cpf", e.target.value)}
            placeholder="000.000.000-00"
          />
        </label>

        <label className="field-label">
          Cargo
          <input
            value={employeeForm.role}
            onChange={(e) => onUpdateForm("role", e.target.value)}
            placeholder="Mecânico"
          />
        </label>

        <label className="field-label">
          Admissão
          <input
            type="date"
            value={employeeForm.admissionDate}
            onChange={(e) => onUpdateForm("admissionDate", e.target.value)}
          />
        </label>

        <label className="field-label">
          Status
          <select value={employeeForm.status} onChange={(e) => onUpdateForm("status", e.target.value)}>
            <option value="trial">{employeeStatusLabels.trial}</option>
            <option value="active">{employeeStatusLabels.active}</option>
            <option value="inactive">{employeeStatusLabels.inactive}</option>
          </select>
        </label>

        <div className="form-section-title">Contrato</div>

        <label className="field-label">
          Tipo
          <select value={employeeForm.paymentType} onChange={(e) => onUpdateForm("paymentType", e.target.value as PaymentType)}>
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
            value={employeeForm.monthlySalary}
            onChange={(e) => onUpdateForm("monthlySalary", e.target.value)}
            placeholder="2500.00"
            disabled={employeeForm.paymentType !== "monthly"}
          />
        </label>

        <label className="field-label">
          Valor da hora
          <input
            type="number"
            min="0"
            step="0.01"
            value={employeeForm.hourlyRate}
            onChange={(e) => onUpdateForm("hourlyRate", e.target.value)}
            placeholder="15.00"
            disabled={employeeForm.paymentType !== "hourly"}
          />
        </label>

        <details className="advanced-fields">
          <summary>Regras avançadas de jornada</summary>
          <div className="advanced-fields-grid">
            <label className="field-label">
              Jornada semanal (h)
              <input type="number" min="1" step="0.5" value={employeeForm.weeklyHours} onChange={(e) => onUpdateForm("weeklyHours", e.target.value)} />
            </label>
            <label className="field-label">
              Minutos por dia
              <input type="number" min="1" step="1" value={employeeForm.dailyMinutes} onChange={(e) => onUpdateForm("dailyMinutes", e.target.value)} />
            </label>
            <label className="field-label">
              Horas mensais (h)
              <input type="number" min="1" step="0.5" value={employeeForm.monthlyHours} onChange={(e) => onUpdateForm("monthlyHours", e.target.value)} />
            </label>
            <fieldset style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
              <legend style={{ fontWeight: 600 }}>Dias de trabalho</legend>
              {weekdayOptions.map((day) => (
                <label key={day.value} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={employeeForm.workDays.includes(day.value)} onChange={() => onToggleWorkDay(day.value)} />
                  {day.label}
                </label>
              ))}
            </fieldset>
            <label className="field-label">
              Extra %
              <input type="number" min="0" step="1" value={employeeForm.overtimePercent} onChange={(e) => onUpdateForm("overtimePercent", e.target.value)} />
            </label>
            <label className="field-label">
              Noturno %
              <input type="number" min="0" step="1" value={employeeForm.nightPercent} onChange={(e) => onUpdateForm("nightPercent", e.target.value)} />
            </label>
          </div>
        </details>

        <div style={{ display: "flex", gap: 8, alignItems: "center", gridColumn: "1 / -1" }}>
          <button type="submit">{editingEmployeeId ? "Salvar alterações" : "Cadastrar funcionário"}</button>
          {editingEmployeeId ? <button type="button" onClick={onResetEmployeeForm}>Cancelar</button> : null}
        </div>
      </form>

      {employees.length > 0 ? (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Funcionários ({employees.length})</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, cargo ou CPF..."
              style={{ flex: 1, minWidth: 200, maxWidth: 340 }}
            />
          </div>

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
                    borderRadius: 10,
                    padding: "12px 14px",
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
                    <button type="button" onClick={() => onEditEmployee(emp)} style={{ fontSize: "0.82rem", padding: "5px 10px" }}>Editar</button>
                    <button
                      type="button"
                      onClick={() => handleShowHistory(emp)}
                      disabled={loadingHistory}
                      style={{ fontSize: "0.82rem", padding: "5px 10px" }}
                    >
                      Histórico
                    </button>
                    <button type="button" onClick={() => onToggleEmployeeActive(emp)} style={{ fontSize: "0.82rem", padding: "5px 10px" }}>
                      {emp.active ? "Inativar" : "Reativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp)}
                      style={{ fontSize: "0.82rem", padding: "5px 10px", color: "var(--danger)", borderColor: "var(--danger)" }}
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
