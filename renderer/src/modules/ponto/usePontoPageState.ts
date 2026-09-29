import { useEffect, useMemo, useState } from "react";
import type {
  AppSettings,
  AuditLog,
  Employee,
  EsocialRemuneracao,
  Holiday,
  HourBankEntry,
  MonthClosing,
  SalaryHistoryEntry,
  TimeAdjustment,
  TimeEvent,
  TimeEventType,
  WorkOrder,
} from "./pontoTypes";
import { buildPayrollCsv, getMonthDates, summarizePayrollMonth, toLocalDateKey } from "./pontoUtils";
import {
  addAdjustment,
  addEvent,
  deleteTimeEvent,
  addHourBankEntry,
  backupDatabase,
  closeMonth,
  deleteEmployeeIfUnused,
  deleteHoliday,
  deleteHourBankEntry,
  deleteWorkOrder,
  generateEsocialS1200,
  generatePdf,
  getNextWorkOrderNumber,
  loadAdjustmentsByRange,
  loadAllSettings,
  loadAuditByRange,
  loadEmployees,
  loadEventsByRange,
  loadHolidaysByRange,
  loadHourBankAll,
  loadMonthClosing,
  loadSalaryHistory,
  loadWorkOrders,
  reopenMonth,
  restoreDatabase,
  saveSetting,
  saveSettings,
  upsertEmployees,
  upsertHoliday,
  upsertWorkOrder,
} from "./pontoApi";
import type { TabKey } from "./pontoPageShared";
import { buildEmployeeFromForm, type AdjustmentFormValues, type EmployeeFormValues, type HolidayFormValues } from "./forms";
import { applyTheme } from "./components/AppConfigTab";

function nowISO() {
  return new Date().toISOString();
}

function newId() {
  return crypto.randomUUID();
}

function toMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function toLocalDateTimeIso(dateKey: string, time: string) {
  const [hour = "00", minute = "00"] = time.split(":");
  const date = new Date(`${dateKey}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`);
  return date.toISOString();
}

function sortEmployees(employees: Employee[]) {
  const order = { active: 0, trial: 1, inactive: 2 };
  return [...employees].sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
}

export function usePontoPageState() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [events, setEvents] = useState<TimeEvent[]>([]);
  const [adjustments, setAdjustments] = useState<TimeAdjustment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [monthClosing, setMonthClosing] = useState<MonthClosing | null>(null);
  const [hourBankEntries, setHourBankEntries] = useState<HourBankEntry[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [workDate, setWorkDate] = useState(() => toLocalDateKey(new Date()));
  const [monthKey, setMonthKey] = useState(() => toMonthKey(toLocalDateKey(new Date())));
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const currentDateKey = toLocalDateKey(new Date());
  const isMonthClosed = Boolean(monthClosing);
  const canRecordForDate = workDate === currentDateKey && !isMonthClosed;
  const monthDates = useMemo(() => getMonthDates(monthKey), [monthKey]);
  const payrollDates = useMemo(() => {
    const currentMonthKey = toMonthKey(currentDateKey);
    if (monthKey > currentMonthKey) return [];
    if (monthKey === currentMonthKey) return monthDates.filter((d) => d <= currentDateKey);
    return monthDates;
  }, [currentDateKey, monthDates, monthKey]);
  const monthStartDate = monthDates[0] ?? workDate;
  const monthEndDate = monthDates[monthDates.length - 1] ?? workDate;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const [
          loadedEmployees,
          loadedEvents,
          loadedAdjustments,
          loadedHolidays,
          loadedClosing,
          loadedAuditLogs,
          loadedHourBank,
          loadedWorkOrders,
          loadedSettings,
        ] = await Promise.all([
          loadEmployees(),
          loadEventsByRange(monthStartDate, monthEndDate),
          loadAdjustmentsByRange(monthStartDate, monthEndDate),
          loadHolidaysByRange(monthStartDate, monthEndDate),
          loadMonthClosing(monthKey),
          loadAuditByRange(monthStartDate, monthEndDate),
          loadHourBankAll(),
          loadWorkOrders(),
          loadAllSettings(),
        ]);

        if (!cancelled) {
          setEmployees(loadedEmployees);
          setEvents(loadedEvents);
          setAdjustments(loadedAdjustments);
          setAuditLogs(loadedAuditLogs);
          setHolidays(loadedHolidays);
          setMonthClosing(loadedClosing);
          setHourBankEntries(loadedHourBank);
          setWorkOrders(loadedWorkOrders);
          const settings = loadedSettings as AppSettings;
          setAppSettings(settings);
          if (settings.theme && settings.theme !== "system") applyTheme(settings.theme);
          if (loadedEmployees.length === 0) setShowOnboarding(true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Falha ao carregar dados.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [monthEndDate, monthKey, monthStartDate]);

  function changeWorkDate(dateKey: string) {
    setWorkDate(dateKey);
    setMonthKey(toMonthKey(dateKey));
  }

  function changeMonth(month: string) {
    setMonthKey(month);
    if (month !== toMonthKey(workDate)) {
      setWorkDate(`${month}-01`);
    }
  }

  function employeeEventsToday(employeeId: string) {
    return events.filter((ev) => ev.employeeId === employeeId && ev.workDate === workDate);
  }

  function canRegister(employeeId: string, type: TimeEventType) {
    const evs = [...employeeEventsToday(employeeId)].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const last = evs.at(-1);
    if (!last) return type === "IN";
    if (last.type === "IN") return type === "OUT";
    return type === "IN";
  }

  async function register(employeeId: string, type: TimeEventType): Promise<TimeEvent | null> {
    if (isMonthClosed) { setError("Competência fechada. Reabra o mês para registrar ponto."); return null; }
    if (!canRecordForDate) { setError("Marcações diretas só podem ser feitas no dia atual."); return null; }
    if (!canRegister(employeeId, type)) return null;
    setError(null);
    setSuccessMessage(null);
    const ev: TimeEvent = { id: newId(), employeeId, timestamp: nowISO(), workDate, type };
    try {
      const saved = await addEvent(ev);
      setEvents((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar ponto.");
      return null;
    }
  }

  async function undoRegister(eventId: string) {
    try {
      await deleteTimeEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível desfazer.");
    }
  }

  async function registerAll(type: TimeEventType) {
    if (isMonthClosed) { setError("Competência fechada."); return; }
    if (!canRecordForDate) { setError("Marcações diretas só podem ser feitas no dia atual."); return; }
    const eligible = employees.filter((e) => e.active && canRegister(e.id, type));
    if (eligible.length === 0) return;
    setError(null);
    setSuccessMessage(null);
    for (const emp of eligible) {
      const ev: TimeEvent = { id: newId(), employeeId: emp.id, timestamp: nowISO(), workDate, type };
      try {
        const saved = await addEvent(ev);
        setEvents((prev) => [...prev, saved]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao registrar ponto em lote.");
        return;
      }
    }
    setSuccessMessage(`${type === "IN" ? "Entrada" : "Saída"} registrada para ${eligible.length} funcionário(s).`);
  }

  async function saveEmployee(values: EmployeeFormValues, editingId: string | null): Promise<boolean> {
    const existing = employees.find((e) => e.id === editingId);
    const employee = buildEmployeeFromForm(values, existing);
    setError(null);
    setSuccessMessage(null);
    try {
      await upsertEmployees([employee]);
      setEmployees((prev) => sortEmployees([...prev.filter((e) => e.id !== employee.id), employee]));
      if (showOnboarding) setShowOnboarding(false);
      setSuccessMessage(existing ? "Funcionário atualizado." : "Funcionário cadastrado.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar funcionário.");
      return false;
    }
  }

  async function toggleEmployeeActive(employee: Employee) {
    const nextStatus = employee.status === "inactive" ? "active" : "inactive";
    const updated = { ...employee, status: nextStatus as Employee["status"], active: nextStatus !== "inactive" };
    setError(null);
    try {
      await upsertEmployees([updated]);
      setEmployees((prev) => sortEmployees(prev.map((e) => (e.id === updated.id ? updated : e))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar funcionário.");
    }
  }

  async function deleteEmployee(employee: Employee): Promise<boolean> {
    if (!window.confirm(`Excluir ${employee.name}? Só funciona se ele não tiver registros de ponto.`)) return false;
    setError(null);
    try {
      await deleteEmployeeIfUnused(employee.id);
      setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir funcionário.");
      return false;
    }
  }

  async function saveAdjustment(values: AdjustmentFormValues): Promise<boolean> {
    if (isMonthClosed) { setError("Competência fechada."); return false; }
    const adjustment: TimeAdjustment = {
      id: newId(),
      eventId: newId(),
      employeeId: values.employeeId,
      timestamp: toLocalDateTimeIso(values.workDate, values.time),
      workDate: values.workDate,
      type: values.type,
      reason: values.reason.trim(),
      createdAt: nowISO(),
    };
    setError(null);
    setSuccessMessage(null);
    try {
      const saved = await addAdjustment(adjustment);
      setAdjustments((prev) => [saved, ...prev]);
      setEvents((prev) => [...prev, {
        id: saved.eventId,
        employeeId: saved.employeeId,
        timestamp: saved.timestamp,
        workDate: saved.workDate,
        type: saved.type,
        source: "adjustment",
        note: saved.reason,
      }]);
      setSuccessMessage("Ajuste salvo.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar ajuste.");
      return false;
    }
  }

  async function saveHoliday(values: HolidayFormValues): Promise<boolean> {
    if (isMonthClosed) { setError("Competência fechada."); return false; }
    const holiday: Holiday = { id: newId(), date: values.date, name: values.name.trim(), scope: values.scope };
    setError(null);
    setSuccessMessage(null);
    try {
      const saved = await upsertHoliday(holiday);
      setHolidays((prev) => [...prev.filter((h) => h.id !== saved.id), saved].sort((a, b) => a.date.localeCompare(b.date)));
      setSuccessMessage("Feriado salvo.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar feriado.");
      return false;
    }
  }

  async function removeHoliday(holiday: Holiday) {
    if (isMonthClosed) { setError("Competência fechada."); return; }
    setError(null);
    try {
      await deleteHoliday(holiday.id);
      setHolidays((prev) => prev.filter((h) => h.id !== holiday.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover feriado.");
    }
  }

  const eventsByEmployee = useMemo(() => {
    const map = new Map<string, TimeEvent[]>();
    for (const emp of employees) map.set(emp.id, []);
    for (const ev of events) map.set(ev.employeeId, [...(map.get(ev.employeeId) ?? []), ev]);
    return map;
  }, [employees, events]);

  const payrollByEmployee = useMemo(() => {
    const map = new Map<string, ReturnType<typeof summarizePayrollMonth>>();
    for (const emp of employees) {
      map.set(emp.id, summarizePayrollMonth(payrollDates, eventsByEmployee.get(emp.id) ?? [], emp.contract, holidays));
    }
    return map;
  }, [employees, eventsByEmployee, holidays, payrollDates]);

  async function closeCurrentMonth(note: string) {
    setError(null);
    try {
      const saved = await closeMonth({ monthKey, closedAt: nowISO(), closedBy: "manager", note: note.trim() });
      setMonthClosing(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao fechar competência.");
    }
  }

  async function reopenCurrentMonth() {
    setError(null);
    try {
      await reopenMonth(monthKey);
      setMonthClosing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao reabrir competência.");
    }
  }

  function exportPayrollCsv() {
    const csv = buildPayrollCsv(monthKey, employees, payrollByEmployee);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `espelho-ponto-${monthKey}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function backupData() {
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await backupDatabase();
      if (!result.canceled) setSuccessMessage(`Backup salvo em ${result.filePath}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar backup.");
    }
  }

  async function restoreData() {
    if (!window.confirm("Restaurar um backup substituirá os dados atuais e reiniciará o aplicativo.")) return;
    setError(null);
    try {
      await restoreDatabase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao restaurar backup.");
    }
  }

  // Banco de horas
  async function addHourBank(entry: Omit<HourBankEntry, "id" | "createdAt">) {
    setError(null);
    try {
      const saved = await addHourBankEntry({ ...entry, id: newId(), createdAt: nowISO() });
      setHourBankEntries((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar no banco de horas.");
    }
  }

  async function removeHourBank(id: string) {
    setError(null);
    try {
      await deleteHourBankEntry(id);
      setHourBankEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover lançamento.");
    }
  }

  // Work orders
  async function saveWorkOrder(wo: WorkOrder) {
    setError(null);
    try {
      const saved = await upsertWorkOrder(wo);
      setWorkOrders((prev) => {
        const others = prev.filter((w) => w.id !== saved.id);
        return [saved, ...others].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar ordem de serviço.");
    }
  }

  async function removeWorkOrder(id: string) {
    setError(null);
    try {
      await deleteWorkOrder(id);
      setWorkOrders((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover ordem de serviço.");
    }
  }

  async function fetchNextWorkOrderNumber() {
    return getNextWorkOrderNumber();
  }

  // Settings
  async function updateAppSettings(partial: Partial<AppSettings> & Record<string, string>) {
    try {
      await saveSettings(partial as Record<string, string>);
      setAppSettings((cur) => ({ ...cur, ...partial }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar configurações.");
      throw err;
    }
  }

  async function updateSingleSetting(key: string, value: string) {
    try {
      await saveSetting(key, value);
      setAppSettings((cur) => ({ ...cur, [key]: value }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar configuração.");
      throw err;
    }
  }

  // eSocial
  async function generateEsocial(payload: {
    competencia: string;
    empregador: { cnpj: string; cpfResponsavel?: string };
    remuneracoes: EsocialRemuneracao[];
  }) {
    return generateEsocialS1200(payload);
  }

  // PDF
  async function generateHoleritePdf(payload: { html: string; filename: string }) {
    return generatePdf(payload);
  }

  // Salary history
  async function fetchSalaryHistory(employeeId: string): Promise<SalaryHistoryEntry[]> {
    return loadSalaryHistory(employeeId);
  }

  return {
    activeTab,
    adjustments,
    auditLogs,
    canRecordForDate,
    backupData,
    changeMonth,
    changeWorkDate,
    closeCurrentMonth,
    deleteEmployee,
    employees,
    eventsByEmployee,
    error,
    holidays,
    hourBankEntries,
    workOrders,
    appSettings,
    isLoading,
    monthEndDate,
    monthClosing,
    monthKey,
    monthDates,
    monthStartDate,
    payrollByEmployee,
    register,
    registerAll,
    undoRegister,
    removeHoliday,
    reopenCurrentMonth,
    saveAdjustment,
    saveEmployee,
    saveHoliday,
    setActiveTab,
    showOnboarding,
    setShowOnboarding,
    successMessage,
    toggleEmployeeActive,
    workDate,
    canRegister,
    exportPayrollCsv,
    isMonthClosed,
    restoreData,
    addHourBank,
    removeHourBank,
    saveWorkOrder,
    removeWorkOrder,
    fetchNextWorkOrderNumber,
    updateAppSettings,
    updateSingleSetting,
    generateEsocial,
    generateHoleritePdf,
    fetchSalaryHistory,
  };
}
