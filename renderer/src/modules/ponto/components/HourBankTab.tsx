import { useState } from "react";
import type { Employee, HourBankEntry, PayrollSummary } from "../pontoTypes";
import { formatMinutes, formatSignedMinutes } from "../pontoUtils";
import { Metric } from "./Metric";

interface HourBankTabProps {
  employees: Employee[];
  hourBankEntries: HourBankEntry[];
  payrollByEmployee: Map<string, PayrollSummary>;
  monthKey: string;
  onAddEntry: (entry: Omit<HourBankEntry, "id" | "createdAt">) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

export function HourBankTab({
  employees,
  hourBankEntries,
  payrollByEmployee,
  monthKey,
  onAddEntry,
  onDeleteEntry,
}: HourBankTabProps) {
  const [employeeId, setEmployeeId] = useState(() => employees[0]?.id ?? "");
  const [minutes, setMinutes] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeEmployees = employees.filter((e) => e.active);

  function getAccumulatedBalance(empId: string): number {
    const payroll = payrollByEmployee.get(empId);
    const currentBalance = payroll?.balanceMinutes ?? 0;
    const compensations = hourBankEntries
      .filter((e) => e.employeeId === empId)
      .reduce((sum, e) => sum + e.minutes, 0);
    return currentBalance - compensations;
  }

  async function handleAdd(evt: React.FormEvent) {
    evt.preventDefault();
    const mins = parseInt(minutes, 10);
    if (!employeeId) { setError("Selecione um funcionário."); return; }
    if (!mins || mins === 0) { setError("Informe os minutos (positivo para crédito, negativo para débito)."); return; }
    setError(null);
    setSaving(true);
    try {
      await onAddEntry({ employeeId, monthKey, minutes: mins, note: note.trim() });
      setMinutes("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const totalBalance = activeEmployees.reduce((sum, e) => sum + getAccumulatedBalance(e.id), 0);

  return (
    <section>
      <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Banco de Horas</h2>
      <p style={{ color: "var(--muted)", margin: "0 0 16px" }}>
        Saldo acumulado de horas extras e compensações da competência {monthKey}.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginBottom: 20 }}>
        <Metric label="Saldo total" value={formatSignedMinutes(totalBalance)} />
        <Metric label="Funcionários" value={String(activeEmployees.length)} />
        <Metric label="Compensações no mês" value={String(hourBankEntries.filter(e => e.monthKey === monthKey).length)} />
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 24 }}>
        {activeEmployees.map((emp) => {
          const payroll = payrollByEmployee.get(emp.id);
          const accumulated = getAccumulatedBalance(emp.id);
          const monthExtra = payroll?.overtimeMinutes ?? 0;
          const monthMissing = payroll?.missingMinutes ?? 0;
          return (
            <div
              key={emp.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 14,
                background: "var(--surface-soft)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{emp.name}</div>
              <div style={{ display: "grid", gap: 4, fontSize: "0.88rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Extra este mês</span>
                  <span style={{ color: "var(--success)" }}>+{formatMinutes(monthExtra)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--muted)" }}>Falta este mês</span>
                  <span style={{ color: "var(--danger)" }}>-{formatMinutes(monthMissing)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 6, marginTop: 4 }}>
                  <span style={{ color: "var(--muted)" }}>Saldo líquido</span>
                  <b style={{ color: accumulated >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {formatSignedMinutes(accumulated)}
                  </b>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 20, background: "var(--surface-soft)" }}>
        <h3 style={{ margin: "0 0 14px" }}>Registrar compensação / lançamento</h3>
        {error ? <div style={{ color: "var(--danger)", marginBottom: 10 }}>{error}</div> : null}
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="field-label">
            Funcionário
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Minutos (+ crédito / - débito)
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="Ex: 60 ou -30"
              style={{ width: 150 }}
            />
          </label>
          <label className="field-label" style={{ flex: 1, minWidth: 200 }}>
            Observação
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: compensado em folga"
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Lançar"}
          </button>
        </form>
      </div>

      {hourBankEntries.length > 0 ? (
        <div>
          <h3 style={{ margin: "0 0 12px" }}>Histórico de compensações</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Funcionário", "Competência", "Minutos", "Observação", "Registrado em", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hourBankEntries.map((entry) => {
                  const emp = employees.find((e) => e.id === entry.employeeId);
                  return (
                    <tr key={entry.id}>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{emp?.name ?? entry.employeeName ?? "—"}</td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{entry.monthKey}</td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>
                        <b style={{ color: entry.minutes >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {formatSignedMinutes(entry.minutes)}
                        </b>
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{entry.note || "—"}</td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>
                        {new Date(entry.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>
                        <button
                          type="button"
                          onClick={() => onDeleteEntry(entry.id)}
                          style={{ fontSize: "0.8rem", padding: "4px 8px", color: "var(--danger)", borderColor: "var(--danger)" }}
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--muted)", textAlign: "center", padding: 24 }}>
          Nenhuma compensação registrada ainda.
        </div>
      )}
    </section>
  );
}
