import { useState } from "react";
import type { Employee, Holiday, PayrollSummary, TimeEvent } from "../pontoTypes";
import {
  formatCurrencyFromCents,
  formatMinutes,
  formatSignedMinutes,
  getStatus,
  isHoliday,
  isScheduledWorkday,
} from "../pontoUtils";
import { ChevronDown } from "lucide-react";

interface SummaryTabProps {
  employees: Employee[];
  eventsByEmployee: Map<string, TimeEvent[]>;
  holidays: Holiday[];
  monthKey: string;
  payrollByEmployee: Map<string, PayrollSummary>;
  workDate: string;
}

export function SummaryTab({
  employees,
  eventsByEmployee,
  holidays,
  monthKey,
  payrollByEmployee,
  workDate,
}: SummaryTabProps) {
  const [showFinancial, setShowFinancial] = useState(false);

  const activeEmployees = employees.filter((e) => e.active);
  const todayEvents = employees.flatMap((e) =>
    (eventsByEmployee.get(e.id) ?? []).filter((ev) => ev.workDate === workDate)
  );
  const workingNow = activeEmployees.filter((e) => {
    const evs = (eventsByEmployee.get(e.id) ?? []).filter((ev) => ev.workDate === workDate);
    return getStatus(evs) === "Trabalhando";
  });
  const holiday = holidays.find((h) => h.date === workDate);

  const dayIssues = activeEmployees.flatMap((e) => {
    const evs = (eventsByEmployee.get(e.id) ?? [])
      .filter((ev) => ev.workDate === workDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const shouldWork = isScheduledWorkday(workDate, e.contract) && !isHoliday(workDate, holidays);
    const last = evs.at(-1);
    if (shouldWork && evs.length === 0) return [{ employee: e, issue: "Sem entrada" }];
    if (last?.type === "IN") return [{ employee: e, issue: "Saída pendente" }];
    return [];
  });

  const totals = employees.reduce(
    (acc, e) => {
      const p = payrollByEmployee.get(e.id);
      if (!p) return acc;
      acc.netEstimateCents += p.netEstimateCents;
      acc.employerCostEstimateCents += p.employerCostEstimateCents;
      acc.grossCents += p.grossCents;
      acc.inssTotal += p.inssDiscountCents;
      acc.fgtsTotal += p.fgtsEmployerCents;
      acc.overtimeMinutes += p.overtimeMinutes;
      acc.balanceMinutes += p.balanceMinutes;
      return acc;
    },
    { netEstimateCents: 0, employerCostEstimateCents: 0, grossCents: 0, inssTotal: 0, fgtsTotal: 0, overtimeMinutes: 0, balanceMinutes: 0 }
  );

  const financeItems = [
    { label: "Competência",        value: monthKey },
    { label: "Extras no mês",      value: formatMinutes(totals.overtimeMinutes) },
    { label: "Saldo banco",        value: formatSignedMinutes(totals.balanceMinutes), cls: totals.balanceMinutes >= 0 ? "success" : "danger" },
    { label: "Folha bruta est.",   value: formatCurrencyFromCents(totals.grossCents) },
    { label: "Folha líquida est.", value: formatCurrencyFromCents(totals.netEstimateCents), cls: "accent" },
    { label: "INSS empregados",    value: formatCurrencyFromCents(totals.inssTotal) },
    { label: "FGTS empregador",    value: formatCurrencyFromCents(totals.fgtsTotal) },
    { label: "Custo total est.",   value: formatCurrencyFromCents(totals.employerCostEstimateCents) },
  ];

  return (
    <section style={{ display: "grid", gap: 12, marginBottom: 4 }}>
      {/* ── Pílulas operacionais ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <StatPill label="Ativos" value={String(activeEmployees.length)} />
        <StatPill label="Trabalhando" value={String(workingNow.length)} color={workingNow.length > 0 ? "success" : "neutral"} />
        <StatPill label="Marcações hoje" value={String(todayEvents.length)} />
        {dayIssues.length > 0
          ? <StatPill label="Pendências" value={String(dayIssues.length)} color="danger" />
          : <StatPill label="Pendências" value="Nenhuma" color="success" />}
        {holiday ? <span className="badge badge-warning" style={{ padding: "4px 10px", fontSize: 12 }}>Feriado: {holiday.name}</span> : null}

        <button
          type="button"
          className="btn-ghost btn-sm"
          style={{ marginLeft: "auto", fontSize: 11.5 }}
          onClick={() => setShowFinancial((v) => !v)}
        >
          {showFinancial ? "Ocultar resumo" : "Resumo financeiro"}
          <span style={{ display: "inline-flex", transform: showFinancial ? "rotate(180deg)" : "none", transition: "transform var(--t)" }}>
            <ChevronDown size={11} strokeWidth={2.5} />
          </span>
        </button>
      </div>

      {/* ── Pendências do dia ── */}
      {dayIssues.length > 0 ? (
        <div className="issues-panel">
          <div className="issues-panel-title">Pendências do dia</div>
          <div className="issues-panel-list">
            {dayIssues.map(({ employee, issue }) => (
              <span key={`${employee.id}-${issue}`} className="issue-item">
                {employee.name} <small>— {issue}</small>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Resumo financeiro (colapsado por padrão) ── */}
      {showFinancial ? (
        <div className="finance-grid">
          {financeItems.map((m) => (
            <div key={m.label}>
              <div className="finance-label">{m.label}</div>
              <div className={`finance-value ${m.cls ?? ""}`.trim()}>{m.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StatPill({ label, value, color = "neutral" }: { label: string; value: string; color?: "success" | "danger" | "neutral" }) {
  return (
    <div className={`stat-pill${color !== "neutral" ? ` ${color}` : ""}`}>
      <span className="stat-pill-label">{label}</span>
      <span className="stat-pill-value">{value}</span>
    </div>
  );
}
