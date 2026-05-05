import type { FormEvent } from "react";
import type { Employee, TimeAdjustment, TimeEventType } from "../pontoTypes";
import { timeEventTypeLabels, type AdjustmentFormState } from "../pontoPageShared";

interface AdjustmentsTabProps {
  adjustmentForm: AdjustmentFormState;
  adjustments: TimeAdjustment[];
  employees: Employee[];
  monthStartDate: string;
  monthEndDate: string;
  disabled: boolean;
  onSaveAdjustment: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateAdjustmentForm: (field: keyof AdjustmentFormState, value: string) => void;
}

export function AdjustmentsTab({
  adjustmentForm,
  adjustments,
  employees,
  monthStartDate,
  monthEndDate,
  disabled,
  onSaveAdjustment,
  onUpdateAdjustmentForm,
}: AdjustmentsTabProps) {
  return (
    <>
      {employees.length > 0 ? (
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 14px", color: "var(--text)" }}>Ajustes manuais</h2>

          <form
            onSubmit={onSaveAdjustment}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              alignItems: "end",
              marginBottom: 20,
              padding: 16,
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              background: "var(--surface-soft)",
            }}
          >
            <label className="field-label">
              Funcionário
              <select
                value={adjustmentForm.employeeId}
                disabled={disabled}
                onChange={(e) => onUpdateAdjustmentForm("employeeId", e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Data
              <input
                type="date"
                value={adjustmentForm.workDate}
                min={monthStartDate}
                max={monthEndDate}
                disabled={disabled}
                onChange={(e) => onUpdateAdjustmentForm("workDate", e.target.value)}
              />
            </label>

            <label className="field-label">
              Hora
              <input
                type="time"
                value={adjustmentForm.time}
                disabled={disabled}
                onChange={(e) => onUpdateAdjustmentForm("time", e.target.value)}
              />
            </label>

            <label className="field-label">
              Tipo
              <select
                value={adjustmentForm.type}
                disabled={disabled}
                onChange={(e) => onUpdateAdjustmentForm("type", e.target.value as TimeEventType)}
              >
                <option value="IN">{timeEventTypeLabels.IN}</option>
                <option value="OUT">{timeEventTypeLabels.OUT}</option>
              </select>
            </label>

            <label className="field-label" style={{ gridColumn: "span 2" }}>
              Motivo
              <input
                value={adjustmentForm.reason}
                disabled={disabled}
                onChange={(e) => onUpdateAdjustmentForm("reason", e.target.value)}
                placeholder="Ex.: funcionário esqueceu de registrar saída"
              />
            </label>

            <button type="submit" disabled={disabled}>Salvar ajuste</button>
          </form>
        </section>
      ) : null}

      {adjustments.length > 0 ? (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px", color: "var(--text)" }}>Ajustes auditados</h2>
          <div style={{ display: "grid", gap: 6 }}>
            {adjustments.slice(0, 8).map((adj) => {
              const emp = employees.find((e) => e.id === adj.employeeId);
              return (
                <div
                  key={adj.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r)",
                    padding: "9px 12px",
                    background: "var(--surface)",
                    fontSize: 13,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <b style={{ color: "var(--text)" }}>{emp?.name ?? "Funcionário removido"}</b>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span style={{ color: "var(--muted)" }}>{adj.workDate}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>{timeEventTypeLabels[adj.type]}</span>
                  <span style={{ color: "var(--muted)" }}>{new Date(adj.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span style={{ color: "var(--text)" }}>{adj.reason}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}
