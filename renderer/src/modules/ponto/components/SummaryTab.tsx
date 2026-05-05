import type { Employee, Holiday, PayrollSummary, TimeEvent } from "../pontoTypes";
import {
  formatCurrencyFromCents,
  formatMinutes,
  formatSignedMinutes,
  getStatus,
  isHoliday,
  isScheduledWorkday,
} from "../pontoUtils";
import { Metric } from "./Metric";

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
  const activeEmployees = employees.filter((e) => e.active);
  const todayEvents = employees.flatMap((e) =>
    (eventsByEmployee.get(e.id) ?? []).filter((ev) => ev.workDate === workDate)
  );
  const workingNow = activeEmployees.filter((e) => {
    const evs = (eventsByEmployee.get(e.id) ?? []).filter((ev) => ev.workDate === workDate);
    return getStatus(evs) === "Trabalhando";
  });
  const holiday = holidays.find((h) => h.date === workDate);

  const totals = employees.reduce(
    (acc, e) => {
      const p = payrollByEmployee.get(e.id);
      if (!p) return acc;
      acc.balanceMinutes += p.balanceMinutes;
      acc.overtimeMinutes += p.overtimeMinutes;
      acc.missingMinutes += p.missingMinutes;
      acc.netEstimateCents += p.netEstimateCents;
      acc.employerCostEstimateCents += p.employerCostEstimateCents;
      acc.grossCents += p.grossCents;
      acc.inssTotal += p.inssDiscountCents;
      acc.fgtsTotal += p.fgtsEmployerCents;
      return acc;
    },
    { balanceMinutes: 0, overtimeMinutes: 0, missingMinutes: 0, netEstimateCents: 0, employerCostEstimateCents: 0, grossCents: 0, inssTotal: 0, fgtsTotal: 0 }
  );

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

  const topOvertimeEmployee = activeEmployees.reduce<{ emp: Employee | null; minutes: number }>(
    (best, e) => {
      const minutes = payrollByEmployee.get(e.id)?.overtimeMinutes ?? 0;
      return minutes > best.minutes ? { emp: e, minutes } : best;
    },
    { emp: null, minutes: 0 }
  );

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))" }}>
        <Metric label="Ativos" value={String(activeEmployees.length)} />
        <Metric label="Trabalhando agora" value={String(workingNow.length)} success={workingNow.length > 0} />
        <Metric label="Marcações hoje" value={String(todayEvents.length)} />
        <Metric label="Pendências hoje" value={String(dayIssues.length)} danger={dayIssues.length > 0} />
        <Metric label="Saldo banco" value={formatSignedMinutes(totals.balanceMinutes)} success={totals.balanceMinutes > 0} danger={totals.balanceMinutes < 0} />
        <Metric label="Extras no mês" value={formatMinutes(totals.overtimeMinutes)} />
        <Metric label="Folha bruta est." value={formatCurrencyFromCents(totals.grossCents)} />
        <Metric label="Folha líquida est." value={formatCurrencyFromCents(totals.netEstimateCents)} accent />
        <Metric label="INSS empregados" value={formatCurrencyFromCents(totals.inssTotal)} />
        <Metric label="FGTS empregador" value={formatCurrencyFromCents(totals.fgtsTotal)} />
        <Metric label="Custo total est." value={formatCurrencyFromCents(totals.employerCostEstimateCents)} />
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Hoje — {workDate}</h2>
          <div style={{ color: "var(--muted)", fontSize: "0.88rem" }}>Competência: {monthKey}</div>
          {holiday ? (
            <div style={{ marginTop: 8, color: "var(--accent)", fontWeight: 600 }}>Feriado: {holiday.name}</div>
          ) : null}
          {workingNow.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Em expediente</div>
              {workingNow.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
                  {e.name}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: "0.88rem" }}>
              Nenhum funcionário com expediente aberto.
            </div>
          )}
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Saldo do mês</h2>
          {activeEmployees.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: "0.88rem" }}>Nenhum funcionário ativo.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {activeEmployees.map((e) => {
                const p = payrollByEmployee.get(e.id);
                const balance = p?.balanceMinutes ?? 0;
                return (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.9rem" }}>{e.name}</span>
                    <b style={{ color: balance >= 0 ? "var(--success)" : "var(--danger)", fontSize: "0.9rem" }}>
                      {formatSignedMinutes(balance)}
                    </b>
                  </div>
                );
              })}
            </div>
          )}
          {topOvertimeEmployee.emp && topOvertimeEmployee.minutes > 0 ? (
            <div style={{ marginTop: 12, fontSize: "0.82rem", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
              Mais horas extras: <b>{topOvertimeEmployee.emp.name}</b> ({formatMinutes(topOvertimeEmployee.minutes)})
            </div>
          ) : null}
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>
            Pendências do dia
            {dayIssues.length > 0 ? (
              <span style={{ marginLeft: 8, background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid", borderRadius: 999, padding: "2px 8px", fontSize: "0.75rem" }}>
                {dayIssues.length}
              </span>
            ) : null}
          </h2>
          {dayIssues.length > 0 ? (
            <div style={{ display: "grid", gap: 6 }}>
              {dayIssues.map(({ employee, issue }) => (
                <div key={`${employee.id}-${issue}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                  <span>{employee.name}</span>
                  <span style={{ color: "var(--danger)", fontSize: "0.82rem", fontWeight: 600 }}>{issue}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
              Nenhuma pendência para {workDate}.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
