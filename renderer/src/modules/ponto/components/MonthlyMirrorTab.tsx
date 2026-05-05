import { useState } from "react";
import type { Employee, Holiday, PayrollSummary, TimeEvent } from "../pontoTypes";
import type { MonthClosing } from "../pontoTypes";
import {
  formatCurrencyFromCents,
  formatMinutes,
  formatSignedMinutes,
  isHoliday,
  isScheduledWorkday,
  toLocalDateKey,
} from "../pontoUtils";
import { Metric } from "./Metric";

interface MonthlyMirrorTabProps {
  employees: Employee[];
  eventsByEmployee: Map<string, TimeEvent[]>;
  holidays: Holiday[];
  monthClosing: MonthClosing | null;
  monthDates: string[];
  monthKey: string;
  payrollByEmployee: Map<string, PayrollSummary>;
  onCloseMonth: (note: string) => void;
  onExportCsv: () => void;
  onReopenMonth: () => void;
  onOpenHolerites: () => void;
}

export function MonthlyMirrorTab({
  employees,
  eventsByEmployee,
  holidays,
  monthClosing,
  monthDates,
  monthKey,
  payrollByEmployee,
  onCloseMonth,
  onExportCsv,
  onReopenMonth,
  onOpenHolerites,
}: MonthlyMirrorTabProps) {
  const [closingNote, setClosingNote] = useState("");

  if (employees.length === 0) return null;

  const todayKey = toLocalDateKey(new Date());
  const datesToCheck = monthDates.filter((dateKey) => dateKey <= todayKey);
  const activeEmployees = employees.filter((employee) => employee.active);
  const totals = employees.reduce(
    (acc, employee) => {
      const payroll = payrollByEmployee.get(employee.id);
      if (!payroll) return acc;

      acc.expectedMinutes += payroll.expectedMinutes;
      acc.workedMinutes += payroll.workedMinutes;
      acc.overtimeMinutes += payroll.overtimeMinutes;
      acc.missingMinutes += payroll.missingMinutes;
      acc.balanceMinutes += payroll.balanceMinutes;
      acc.netEstimateCents += payroll.netEstimateCents;
      acc.employerCostEstimateCents += payroll.employerCostEstimateCents;
      return acc;
    },
    {
      expectedMinutes: 0,
      workedMinutes: 0,
      overtimeMinutes: 0,
      missingMinutes: 0,
      balanceMinutes: 0,
      netEstimateCents: 0,
      employerCostEstimateCents: 0,
    }
  );
  const closingIssues = activeEmployees.flatMap((employee) => {
    const employeeEvents = eventsByEmployee.get(employee.id) ?? [];

    return datesToCheck.flatMap((dateKey) => {
      const shouldWork = isScheduledWorkday(dateKey, employee.contract) && !isHoliday(dateKey, holidays);
      if (!shouldWork) return [];

      const dayEvents = employeeEvents
        .filter((event) => event.workDate === dateKey)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastEvent = dayEvents.at(-1);

      if (dayEvents.length === 0) {
        return [{ employeeName: employee.name, dateKey, message: "Sem entrada registrada" }];
      }

      if (lastEvent?.type === "IN") {
        return [{ employeeName: employee.name, dateKey, message: "Saída pendente" }];
      }

      return [];
    });
  });
  const adjustmentCount = employees.reduce(
    (count, employee) =>
      count +
      (eventsByEmployee.get(employee.id) ?? []).filter(
        (event) => event.workDate.startsWith(monthKey) && event.source === "adjustment"
      ).length,
    0
  );
  const canCloseCleanly = closingIssues.length === 0;

  function handleCloseMonth() {
    if (!canCloseCleanly) {
      const confirmed = window.confirm(
        `Existem ${closingIssues.length} pendência(s) nesta competência. Deseja fechar mesmo assim?`
      );
      if (!confirmed) return;
    }

    onCloseMonth(closingNote);
    setClosingNote("");
  }

  return (
    <section className="print-report" style={{ marginBottom: 20 }}>
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "end",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Espelho mensal</h2>
          <div style={{ opacity: 0.75 }}>
            {monthClosing
              ? `Competência ${monthKey} fechada em ${new Date(monthClosing.closedAt).toLocaleString()}`
              : `Competência ${monthKey} aberta`}
          </div>
          {monthClosing?.note ? <div style={{ opacity: 0.75 }}>Observação: {monthClosing.note}</div> : null}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
          <button type="button" onClick={() => window.print()}>
            Imprimir / PDF
          </button>

          <button type="button" onClick={onExportCsv}>
            Exportar CSV
          </button>

          <button type="button" onClick={onOpenHolerites} style={{ background: "var(--accent-strong)", color: "#fff", border: "none" }}>
            Holerites PDF
          </button>

          {monthClosing ? (
            <button type="button" onClick={onReopenMonth}>
              Reabrir competência
            </button>
          ) : (
            <>
              <label className="field-label">
                Observação
                <input
                  value={closingNote}
                  onChange={(event) => setClosingNote(event.target.value)}
                  placeholder="Ex.: conferido com gerente"
                />
              </label>
              <button
                type="button"
                onClick={handleCloseMonth}
              >
                {canCloseCleanly ? "Fechar competência" : "Fechar com pendências"}
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="no-print"
        style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 16 }}
      >
        <Metric label="Funcionários ativos" value={String(activeEmployees.length)} />
        <Metric label="Previsto" value={formatMinutes(totals.expectedMinutes)} />
        <Metric label="Trabalhado" value={formatMinutes(totals.workedMinutes)} />
        <Metric label="Banco" value={formatSignedMinutes(totals.balanceMinutes)} />
        <Metric label="Pendências" value={String(closingIssues.length)} />
        <Metric label="Ajustes no mês" value={String(adjustmentCount)} />
        <Metric label="Líquido est." value={formatCurrencyFromCents(totals.netEstimateCents)} />
        <Metric label="Custo est." value={formatCurrencyFromCents(totals.employerCostEstimateCents)} />
      </div>

      <div
        className="no-print"
        style={{
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0 0 4px" }}>Checklist de fechamento</h3>
            <div style={{ opacity: 0.75 }}>
              {canCloseCleanly
                ? "A competência não possui pendências operacionais até a data atual."
                : "Revise as pendências antes de fechar a competência."}
            </div>
          </div>
          <span className={canCloseCleanly ? "status-pill status-open" : "status-pill status-closed"}>
            {canCloseCleanly ? "Pronto para fechar" : "Revisão necessária"}
          </span>
        </div>

        {closingIssues.length > 0 ? (
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {closingIssues.slice(0, 8).map((issue) => (
              <div
                key={`${issue.employeeName}-${issue.dateKey}-${issue.message}`}
                style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}
              >
                <b>{issue.employeeName}</b> - {issue.dateKey}: {issue.message}
              </div>
            ))}
            {closingIssues.length > 8 ? (
              <div style={{ opacity: 0.72 }}>
                Mais {closingIssues.length - 8} pendência(s). Use o relatório individual para conferir.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="print-only" style={{ display: "none" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20 }}>Espelho mensal - JF Mecatrônica</h1>
        <div>Competência: {monthKey}</div>
        <div>
          Status:{" "}
          {monthClosing
            ? `Fechada em ${new Date(monthClosing.closedAt).toLocaleString()}`
            : "Aberta"}
        </div>
        {monthClosing?.note ? <div>Observação: {monthClosing.note}</div> : null}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
          <thead>
            <tr>
              {[
                "Funcionário",
                "Previsto",
                "Trabalhado",
                "Extra",
                "Atraso/falta",
                "Banco",
                "Noturno",
                "DSR",
                "Bruto",
                "Faltas",
                "INSS",
                "IRRF",
                "Liquido est.",
                "FGTS emp.",
                "Custo est.",
              ].map((heading) => (
                <th key={heading} style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => {
              const payroll = payrollByEmployee.get(employee.id);
              if (!payroll) return null;

              return (
                <tr key={employee.id}>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>{employee.name}</td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatMinutes(payroll.expectedMinutes)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatMinutes(payroll.workedMinutes)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatMinutes(payroll.overtimeMinutes)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatMinutes(payroll.missingMinutes)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    <b>{formatSignedMinutes(payroll.balanceMinutes)}</b>
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatMinutes(payroll.nightMinutes)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.dsrCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.grossCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.missingDiscountCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.inssDiscountCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.irrfDiscountCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    <b>{formatCurrencyFromCents(payroll.netEstimateCents)}</b>
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.fgtsEmployerCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(payroll.employerCostEstimateCents)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
