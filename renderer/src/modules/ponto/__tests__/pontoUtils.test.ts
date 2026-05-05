import { describe, expect, it } from "vitest";
import {
  calculateNightWorkedMs,
  calculateWorkedMs,
  summarizePayrollMonth,
  summarizeWorkday,
} from "../pontoUtils";
import type { EmploymentContract, Holiday, TimeEvent } from "../pontoTypes";

const monthlyContract: EmploymentContract = {
  id: "contract-1",
  employeeId: "employee-1",
  paymentType: "monthly",
  monthlySalaryCents: 220000,
  hourlyRateCents: 0,
  weeklyHours: 44,
  dailyMinutes: 480,
  monthlyHours: 220,
  workDays: [1, 2, 3, 4, 5],
  overtimePercent: 50,
  nightPercent: 20,
  startDate: "2026-04-01",
  endDate: null,
  active: true,
};

const hourlyContract: EmploymentContract = {
  ...monthlyContract,
  id: "contract-2",
  paymentType: "hourly",
  monthlySalaryCents: 0,
  hourlyRateCents: 2500,
};

function event(id: string, timestamp: string, type: "IN" | "OUT", workDate = "2026-04-01"): TimeEvent {
  return {
    id,
    employeeId: "employee-1",
    timestamp,
    workDate,
    type,
  };
}

describe("pontoUtils", () => {
  it("soma periodos alternados de entrada e saida como horas trabalhadas", () => {
    const events = [
      event("1", "2026-04-01T08:00:00-03:00", "IN"),
      event("2", "2026-04-01T12:00:00-03:00", "OUT"),
      event("3", "2026-04-01T13:30:00-03:00", "IN"),
      event("4", "2026-04-01T17:30:00-03:00", "OUT"),
    ];

    expect(calculateWorkedMs(events)).toBe(8 * 60 * 60 * 1000);
  });

  it("calcula hora extra apenas acima da tolerancia diaria", () => {
    const events = [
      event("1", "2026-04-01T08:00:00-03:00", "IN"),
      event("2", "2026-04-01T12:00:00-03:00", "OUT"),
      event("3", "2026-04-01T13:00:00-03:00", "IN"),
      event("4", "2026-04-01T18:00:00-03:00", "OUT"),
    ];

    const summary = summarizeWorkday(events, monthlyContract);

    expect(summary.workedMinutes).toBe(540);
    expect(summary.normalMinutes).toBe(480);
    expect(summary.overtimeMinutes).toBe(60);
    expect(summary.grossDayCents).toBe(8000);
    expect(summary.overtimeCents).toBe(1500);
  });

  it("desconsidera pequenas faltas dentro da tolerancia diaria", () => {
    const events = [
      event("1", "2026-04-01T08:00:00-03:00", "IN"),
      event("2", "2026-04-01T15:55:00-03:00", "OUT"),
    ];

    const summary = summarizeWorkday(events, monthlyContract);

    expect(summary.workedMinutes).toBe(475);
    expect(summary.missingMinutes).toBe(0);
  });

  it("aplica hora noturna reduzida e adicional noturno", () => {
    const events = [
      event("1", "2026-04-01T22:00:00-03:00", "IN"),
      event("2", "2026-04-02T05:00:00-03:00", "OUT"),
    ];

    const summary = summarizeWorkday(events, monthlyContract, 0);

    expect(Math.floor(calculateNightWorkedMs(events) / 60000)).toBe(420);
    expect(summary.nightMinutes).toBe(480);
    expect(summary.nightBonusCents).toBe(1600);
  });

  it("estima salario mensal com desconto de faltas e sem cobrar feriado como dia esperado", () => {
    const holidays: Holiday[] = [
      {
        id: "holiday-1",
        date: "2026-04-03",
        name: "Feriado da empresa",
        scope: "company",
      },
    ];
    const events = [
      event("1", "2026-04-01T08:00:00-03:00", "IN", "2026-04-01"),
      event("2", "2026-04-01T12:00:00-03:00", "OUT", "2026-04-01"),
      event("3", "2026-04-01T13:00:00-03:00", "IN", "2026-04-01"),
      event("4", "2026-04-01T17:00:00-03:00", "OUT", "2026-04-01"),
      event("5", "2026-04-02T08:00:00-03:00", "IN", "2026-04-02"),
      event("6", "2026-04-02T16:40:00-03:00", "OUT", "2026-04-02"),
    ];

    const summary = summarizePayrollMonth(
      ["2026-04-01", "2026-04-02", "2026-04-03"],
      events,
      monthlyContract,
      holidays
    );

    expect(summary.expectedMinutes).toBe(960);
    expect(summary.overtimeMinutes).toBe(40);
    expect(summary.missingMinutes).toBe(0);
    expect(summary.balanceMinutes).toBe(40);
    expect(summary.grossCents).toBe(221000);
    expect(summary.inssDiscountCents).toBe(17459);
    expect(summary.netEstimateCents).toBe(203541);
  });

  it("estima pagamento horista somente pelas horas normais trabalhadas, extras e adicional noturno", () => {
    const events = [
      event("1", "2026-04-01T08:00:00-03:00", "IN"),
      event("2", "2026-04-01T12:00:00-03:00", "OUT"),
      event("3", "2026-04-01T13:00:00-03:00", "IN"),
      event("4", "2026-04-01T18:00:00-03:00", "OUT"),
    ];

    const summary = summarizePayrollMonth(["2026-04-01"], events, hourlyContract);

    expect(summary.baseSalaryCents).toBe(0);
    expect(summary.normalWorkedCents).toBe(20000);
    expect(summary.overtimeCents).toBe(3750);
    expect(summary.grossCents).toBe(23750);
    expect(summary.inssDiscountCents).toBe(1781);
    expect(summary.netEstimateCents).toBe(21969);
  });
});
