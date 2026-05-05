import { useEffect, useState } from "react";
import type { Employee, Holiday, TimeEvent, TimeEventType } from "../pontoTypes";
import {
  formatMinutes,
  formatWorked,
  getStatus,
  isHoliday,
  isScheduledWorkday,
  summarizeWorkday,
} from "../pontoUtils";
import { employeeStatusLabels, timeEventTypeLabels } from "../pontoPageShared";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="live-clock">
      <div className="live-clock-time">{time}</div>
      <div className="live-clock-date">{date}</div>
    </div>
  );
}

interface DailyPunchTabProps {
  employees: Employee[];
  eventsByEmployee: Map<string, TimeEvent[]>;
  holidays: Holiday[];
  workDate: string;
  canRecordForDate: boolean;
  onCanRegister: (employeeId: string, type: TimeEventType) => boolean;
  onRegister: (employeeId: string, type: TimeEventType) => void;
  onBatchRegister: (type: TimeEventType) => void;
  onEditEmployee: (employee: Employee) => void;
  onToggleEmployeeActive: (employee: Employee) => void;
}

export function DailyPunchTab({
  employees,
  eventsByEmployee,
  holidays,
  workDate,
  canRecordForDate,
  onCanRegister,
  onRegister,
  onBatchRegister,
  onEditEmployee,
  onToggleEmployeeActive,
}: DailyPunchTabProps) {
  const [search, setSearch] = useState("");
  const activeEmployees = employees.filter((e) => e.active);
  const canBatchIn  = canRecordForDate && activeEmployees.some((e) => onCanRegister(e.id, "IN"));
  const canBatchOut = canRecordForDate && activeEmployees.some((e) => onCanRegister(e.id, "OUT"));
  const filtered = search.trim()
    ? employees.filter((e) => e.name.toLowerCase().includes(search.trim().toLowerCase()))
    : employees;

  return (
    <div>
      <LiveClock />

      {(canBatchIn || canBatchOut) ? (
        <div className="batch-bar">
          <span>Registrar para todos:</span>
          {canBatchIn ? (
            <button
              type="button"
              onClick={() => onBatchRegister("IN")}
              style={{ fontSize: 12.5, padding: "4px 12px", background: "var(--success-bg)", color: "var(--success)", borderColor: "color-mix(in srgb, var(--success) 35%, transparent)", fontWeight: 600 }}
            >
              ↓ Entrada de todos
            </button>
          ) : null}
          {canBatchOut ? (
            <button
              type="button"
              onClick={() => onBatchRegister("OUT")}
              style={{ fontSize: 12.5, padding: "4px 12px", background: "var(--danger-bg)", color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 35%, transparent)", fontWeight: 600 }}
            >
              ↑ Saída de todos
            </button>
          ) : null}
        </div>
      ) : null}

      {employees.length > 4 ? (
        <div style={{ marginBottom: 10 }}>
          <input
            type="search"
            placeholder="Filtrar funcionários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", fontSize: 13, padding: "7px 12px" }}
          />
        </div>
      ) : null}

      {filtered.length === 0 && search ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          Nenhum funcionário encontrado para "{search}".
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
      {filtered.map((emp) => {
        const evs = (eventsByEmployee.get(emp.id) ?? [])
          .filter((ev) => ev.workDate === workDate)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const holiday = holidays.find((h) => h.date === workDate);
        const status = getStatus(evs);
        const isWorking = status === "Trabalhando";
        const expectedMinutes =
          isScheduledWorkday(workDate, emp.contract) && !isHoliday(workDate, holidays)
            ? emp.contract?.dailyMinutes
            : 0;
        const summary = summarizeWorkday(evs, emp.contract, expectedMinutes);
        const inEnabled = emp.active && canRecordForDate && onCanRegister(emp.id, "IN");
        const outEnabled = emp.active && canRecordForDate && onCanRegister(emp.id, "OUT");

        const contractLabel = emp.contract
          ? emp.contract.paymentType === "hourly"
            ? "Horista"
            : "Mensalista"
          : "Contrato pendente";

        return (
          <div
            key={emp.id}
            style={{
              border: `1px solid ${isWorking ? "color-mix(in srgb, var(--success) 35%, transparent)" : "var(--border)"}`,
              borderRadius: "var(--r-md)",
              background: "var(--surface)",
              opacity: emp.active ? 1 : 0.52,
              transition: "border-color var(--t), box-shadow var(--t)",
              overflow: "hidden",
            }}
          >
            {/* ── Header ── */}
            <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                {/* Status dot */}
                <div style={{
                  width: 9, height: 9, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                  background: isWorking ? "var(--success)" : "var(--border-strong)",
                  boxShadow: isWorking ? "0 0 0 3px color-mix(in srgb, var(--success) 22%, transparent)" : "none",
                  transition: "background var(--t), box-shadow var(--t)",
                }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text)" }}>{emp.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: "var(--r-full)", background: "var(--surface-strong)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                      {employeeStatusLabels[emp.status]}
                    </span>
                    {holiday ? (
                      <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 7px", borderRadius: "var(--r-full)", background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)" }}>
                        Feriado: {holiday.name}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span>{emp.role || "Cargo não informado"}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span>{contractLabel}</span>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ fontWeight: 600, color: isWorking ? "var(--success)" : "var(--muted)" }}>{status}</span>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => onRegister(emp.id, "IN")}
                  disabled={!inEnabled}
                  style={{
                    fontSize: 12.5, padding: "5px 14px",
                    background: inEnabled ? "var(--success-bg)" : undefined,
                    color: inEnabled ? "var(--success)" : undefined,
                    borderColor: inEnabled ? "color-mix(in srgb, var(--success) 35%, transparent)" : undefined,
                    fontWeight: 600,
                  }}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => onRegister(emp.id, "OUT")}
                  disabled={!outEnabled}
                  style={{
                    fontSize: 12.5, padding: "5px 14px",
                    background: outEnabled ? "var(--danger-bg)" : undefined,
                    color: outEnabled ? "var(--danger)" : undefined,
                    borderColor: outEnabled ? "color-mix(in srgb, var(--danger) 35%, transparent)" : undefined,
                    fontWeight: 600,
                  }}
                >
                  Saída
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => onEditEmployee(emp)}>
                  Editar
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => onToggleEmployeeActive(emp)}>
                  {emp.active ? "Inativar" : "Reativar"}
                </button>
              </div>
            </div>

            {/* ── Metrics strip ── */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-soft)", padding: "9px 16px", display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { label: "Previsto", value: formatMinutes(summary.expectedMinutes), color: "var(--text)" },
                { label: "Trabalhado", value: formatWorked(summary.workedMs), color: "var(--text)", bold: true },
                { label: "Extra", value: formatMinutes(summary.overtimeMinutes), color: summary.overtimeMinutes > 0 ? "var(--success)" : "var(--muted)" },
                { label: "Atraso", value: formatMinutes(summary.missingMinutes), color: summary.missingMinutes > 0 ? "var(--danger)" : "var(--muted)" },
                { label: "Noturno", value: formatMinutes(summary.nightMinutes), color: "var(--muted)" },
              ].map((m) => (
                <div key={m.label}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--disabled)", marginBottom: 2 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: m.bold ? 700 : 600, color: m.color }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Events ── */}
            {evs.length > 0 ? (
              <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {evs.map((ev) => (
                  <span
                    key={ev.id}
                    style={{
                      fontSize: 11.5,
                      padding: "2px 10px",
                      borderRadius: "var(--r-full)",
                      background: ev.type === "IN" ? "var(--success-bg)" : "var(--surface-raised)",
                      color: ev.type === "IN" ? "var(--success)" : "var(--muted)",
                      border: "1px solid",
                      borderColor: ev.type === "IN"
                        ? "color-mix(in srgb, var(--success) 28%, transparent)"
                        : "var(--border)",
                      fontWeight: 500,
                    }}
                  >
                    {timeEventTypeLabels[ev.type]} {new Date(ev.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {ev.source === "adjustment" ? " ·" : ""}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ borderTop: "1px solid var(--border-subtle)", padding: "7px 16px", fontSize: 12, color: "var(--disabled)" }}>
                Sem registros para este dia.
              </div>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
}
