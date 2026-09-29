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
import { LogIn, LogOut } from "lucide-react";

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

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts.at(-1)![0] : "";
  return (first + last).toUpperCase();
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
            <button type="button" className="btn-soft-success btn-sm" onClick={() => onBatchRegister("IN")}>
              <LogIn size={13} /> Entrada de todos
            </button>
          ) : null}
          {canBatchOut ? (
            <button type="button" className="btn-soft-danger btn-sm" onClick={() => onBatchRegister("OUT")}>
              <LogOut size={13} /> Saída de todos
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
            style={{ width: "100%" }}
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
            ? emp.contract.paymentType === "hourly" ? "Horista" : "Mensalista"
            : "Contrato pendente";

          const cardClass = [
            "punch-card",
            isWorking ? "working" : "",
            emp.active ? "" : "inactive",
          ].filter(Boolean).join(" ");

          const metrics = [
            { label: "Previsto",   value: formatMinutes(summary.expectedMinutes), cls: "" },
            { label: "Trabalhado", value: formatWorked(summary.workedMs), cls: "strong" },
            { label: "Extra",      value: formatMinutes(summary.overtimeMinutes), cls: summary.overtimeMinutes > 0 ? "success" : "" },
            { label: "Atraso",     value: formatMinutes(summary.missingMinutes),  cls: summary.missingMinutes > 0 ? "danger" : "" },
            { label: "Noturno",    value: formatMinutes(summary.nightMinutes),    cls: "" },
          ];

          return (
            <div key={emp.id} className={cardClass}>
              <div className="punch-card-header">
                <div className="punch-identity">
                  <div className="avatar">
                    {initialsOf(emp.name)}
                    <span className="avatar-dot" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="punch-title-row">
                      <span className="punch-name">{emp.name}</span>
                      <span className="badge badge-neutral">{employeeStatusLabels[emp.status]}</span>
                      {holiday ? <span className="badge badge-warning">Feriado: {holiday.name}</span> : null}
                    </div>
                    <div className="punch-meta">
                      <span>{emp.role || "Cargo não informado"}</span>
                      <span className="sep">·</span>
                      <span>{contractLabel}</span>
                      <span className="sep">·</span>
                      <span className="status">{status}</span>
                    </div>
                  </div>
                </div>

                <div className="punch-actions">
                  <button
                    type="button"
                    className={inEnabled ? "btn-soft-success" : undefined}
                    onClick={() => onRegister(emp.id, "IN")}
                    disabled={!inEnabled}
                  >
                    <LogIn size={14} /> Entrada
                  </button>
                  <button
                    type="button"
                    className={outEnabled ? "btn-soft-danger" : undefined}
                    onClick={() => onRegister(emp.id, "OUT")}
                    disabled={!outEnabled}
                  >
                    <LogOut size={14} /> Saída
                  </button>
                </div>
              </div>

              <div className="punch-metrics">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="punch-metric-label">{m.label}</div>
                    <div className={`punch-metric-value ${m.cls}`.trim()}>{m.value}</div>
                  </div>
                ))}
              </div>

              {evs.length > 0 ? (
                <div className="punch-events">
                  {evs.map((ev) => (
                    <span key={ev.id} className={`event-chip${ev.type === "IN" ? " in" : ""}`}>
                      {timeEventTypeLabels[ev.type]} {new Date(ev.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {ev.source === "adjustment" ? " ·" : ""}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="punch-events-empty">Sem registros para este dia.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
