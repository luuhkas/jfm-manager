import { useMemo, useState } from "react";
import type { Employee, Holiday, PayrollSummary, TimeEvent } from "../pontoTypes";
import { timeEventTypeLabels } from "../pontoPageShared";
import {
  formatCurrencyFromCents,
  formatMinutes,
  formatSignedMinutes,
  isHoliday,
  isScheduledWorkday,
  summarizeWorkday,
} from "../pontoUtils";
import { Metric } from "./Metric";

interface EmployeeReportTabProps {
  employees: Employee[];
  eventsByEmployee: Map<string, TimeEvent[]>;
  holidays: Holiday[];
  monthDates: string[];
  monthKey: string;
  payrollByEmployee: Map<string, PayrollSummary>;
}

export function EmployeeReportTab({
  employees,
  eventsByEmployee,
  holidays,
  monthDates,
  monthKey,
  payrollByEmployee,
}: EmployeeReportTabProps) {
  const [employeeId, setEmployeeId] = useState(() => employees[0]?.id ?? "");
  const selectedEmployee = employees.find((employee) => employee.id === employeeId) ?? employees[0];
  const selectedEvents = useMemo(
    () => (selectedEmployee ? eventsByEmployee.get(selectedEmployee.id) ?? [] : []),
    [eventsByEmployee, selectedEmployee]
  );
  const payroll = selectedEmployee ? payrollByEmployee.get(selectedEmployee.id) : null;

  if (employees.length === 0) {
    return <div style={{ opacity: 0.75 }}>Cadastre um funcionário para gerar relatório individual.</div>;
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
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Relatório individual</h2>
          <div style={{ opacity: 0.75 }}>Conferência diária da competência {monthKey}</div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
          <label className="field-label">
            Funcionário
            <select value={selectedEmployee?.id ?? ""} onChange={(event) => setEmployeeId(event.target.value)}>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => window.print()}>
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="print-only" style={{ display: "none" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 20 }}>Relatório individual - JF Mecatrônica</h1>
        <div>Funcionário: {selectedEmployee?.name}</div>
        <div>Competência: {monthKey}</div>
      </div>

      {selectedEmployee && payroll ? (
        <>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <Metric label="Previsto" value={formatMinutes(payroll.expectedMinutes)} />
            <Metric label="Trabalhado" value={formatMinutes(payroll.workedMinutes)} />
            <Metric label="Extra" value={formatMinutes(payroll.overtimeMinutes)} />
            <Metric label="Atraso/falta" value={formatMinutes(payroll.missingMinutes)} />
            <Metric label="Banco" value={formatSignedMinutes(payroll.balanceMinutes)} />
            <Metric label="Líquido est." value={formatCurrencyFromCents(payroll.netEstimateCents)} />
          </div>

          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr>
                  {["Data", "Registros", "Previsto", "Trabalhado", "Extra", "Falta", "Banco"].map((heading) => (
                    <th key={heading} style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthDates.map((dateKey) => {
                  const dayEvents = selectedEvents
                    .filter((event) => event.workDate === dateKey)
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                  const expectedMinutes =
                    isScheduledWorkday(dateKey, selectedEmployee.contract) && !isHoliday(dateKey, holidays)
                      ? selectedEmployee.contract?.dailyMinutes
                      : 0;
                  const summary = summarizeWorkday(dayEvents, selectedEmployee.contract, expectedMinutes);
                  const eventText =
                    dayEvents.length > 0
                      ? dayEvents
                          .map(
                            (event) =>
                              `${timeEventTypeLabels[event.type]} ${new Date(event.timestamp).toLocaleTimeString()}`
                          )
                          .join(" | ")
                      : "-";

                  return (
                    <tr key={dateKey}>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>{dateKey}</td>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>{eventText}</td>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                        {formatMinutes(summary.expectedMinutes)}
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                        {formatMinutes(summary.workedMinutes)}
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                        {formatMinutes(summary.overtimeMinutes)}
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                        {formatMinutes(summary.missingMinutes)}
                      </td>
                      <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                        <b>{formatSignedMinutes(summary.balanceMinutes)}</b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
