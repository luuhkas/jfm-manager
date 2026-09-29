import { useEffect, useState } from "react";
import { AdjustmentsTab } from "./components/AdjustmentsTab";
import { AppConfigTab, applyTheme } from "./components/AppConfigTab";
import { DailyPunchTab } from "./components/DailyPunchTab";
import { EmployeesTab } from "./components/EmployeesTab";
import { EmployeeReportTab } from "./components/EmployeeReportTab";
import { EsocialTab } from "./components/EsocialTab";
import { HistoryTab } from "./components/HistoryTab";
import { HoleriteTab } from "./components/HoleriteTab";
import { HolidaysTab } from "./components/HolidaysTab";
import { HourBankTab } from "./components/HourBankTab";
import { MonthlyMirrorTab } from "./components/MonthlyMirrorTab";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { PayrollRulesTab } from "./components/PayrollRulesTab";
import { Sidebar, navItems } from "./components/Sidebar";
import { SummaryTab } from "./components/SummaryTab";
import { Topbar } from "./components/Topbar";
import { WorkOrderTab } from "./components/WorkOrderTab";
import { AlertCircle, AlertTriangle, Users } from "lucide-react";
import { Toaster, toast } from "sonner";
import { LoadingSkeleton } from "./components/ui/Skeleton";
import { usePontoPageState } from "./usePontoPageState";

type ClosingSub = "mirror" | "relatorio" | "esocial" | "holerites";

const closingSubTabs: { key: ClosingSub; label: string }[] = [
  { key: "mirror",    label: "Espelho" },
  { key: "relatorio", label: "Relatório" },
  { key: "esocial",   label: "eSocial" },
  { key: "holerites", label: "Holerites" },
];

export default function PontoPage() {
  const ponto = usePontoPageState();
  const [closingSub, setClosingSub] = useState<ClosingSub>("mirror");

  useEffect(() => { if (ponto.error) toast.error(ponto.error); }, [ponto.error]);
  useEffect(() => { if (ponto.successMessage) toast.success(ponto.successMessage); }, [ponto.successMessage]);

  async function handleRegister(employeeId: string, type: "IN" | "OUT") {
    const ev = await ponto.register(employeeId, type);
    if (ev) {
      const label = type === "IN" ? "Entrada" : "Saída";
      const eventId = ev.id;
      toast.success(`${label} registrada.`, {
        action: { label: "Desfazer", onClick: () => ponto.undoRegister(eventId) },
        duration: 6000,
      });
    }
  }

  const currentTheme = ponto.appSettings.theme ?? "system";
  function toggleTheme() {
    const next = currentTheme === "dark" ? "light" : "dark";
    applyTheme(next);
    ponto.updateSingleSetting("theme", next).catch(() => {});
  }

  /* Teclas 1-6 trocam de tab (fora de campos de formulário) */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < navItems.length) ponto.setActiveTab(navItems[idx].key);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ponto.setActiveTab]);

  const companyName = ponto.appSettings.companyName ?? "JF Mecatrônica";
  const companyCnpj = ponto.appSettings.companyCnpj ?? "";
  const activeNav = navItems.find((n) => n.key === ponto.activeTab);

  return (
    <div className="app-layout">
      {ponto.showOnboarding ? (
        <OnboardingWizard
          onStart={() => {
            ponto.setShowOnboarding(false);
            ponto.setActiveTab("employees");
          }}
        />
      ) : null}

      <Sidebar
        activeTab={ponto.activeTab}
        companyName={companyName}
        monthKey={ponto.monthKey}
        isMonthClosed={ponto.isMonthClosed}
        theme={currentTheme}
        onSelectTab={ponto.setActiveTab}
        onToggleTheme={toggleTheme}
      />

      <div className="main-area">
        <Topbar
          title={activeNav?.label ?? "Ponto"}
          desc={activeNav?.desc}
          monthKey={ponto.monthKey}
          workDate={ponto.workDate}
          onChangeMonth={ponto.changeMonth}
          onChangeWorkDate={ponto.changeWorkDate}
        />

        <div className="content-area">
          <div className="content-inner">
            <div className="notice" role="note" style={{ marginBottom: 18 }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><AlertTriangle size={14} /></span>
              <span>Valores estimados. Confirme fechamento de folha, convenção coletiva e encargos com a contabilidade.</span>
            </div>

            {ponto.isLoading ? <LoadingSkeleton /> : null}

            {!ponto.isLoading && ponto.activeTab === "today" && ponto.employees.length > 0 && !ponto.canRecordForDate ? (
              <div className="notice-info" style={{ marginBottom: 16 }}>
                <AlertCircle size={13} />
                {ponto.isMonthClosed ? "Competência fechada — somente consulta." : "Data anterior — somente consulta."}
              </div>
            ) : null}

            {/* ── TAB: Hoje ── */}
            {!ponto.isLoading && ponto.activeTab === "today" ? (
              <div className="section-stack tab-panel" key="today">
                <SummaryTab
                  employees={ponto.employees}
                  eventsByEmployee={ponto.eventsByEmployee}
                  holidays={ponto.holidays}
                  monthKey={ponto.monthKey}
                  payrollByEmployee={ponto.payrollByEmployee}
                  workDate={ponto.workDate}
                />
                {ponto.employees.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Users size={22} strokeWidth={1.8} /></div>
                    <h3>Nenhum funcionário cadastrado</h3>
                    <p>Cadastre os funcionários antes de começar a registrar o ponto diário.</p>
                    <button type="button" className="btn-primary" onClick={() => ponto.setActiveTab("employees")}>
                      Cadastrar funcionários
                    </button>
                  </div>
                ) : (
                  <DailyPunchTab
                    employees={ponto.employees}
                    eventsByEmployee={ponto.eventsByEmployee}
                    holidays={ponto.holidays}
                    workDate={ponto.workDate}
                    canRecordForDate={ponto.canRecordForDate}
                    onCanRegister={ponto.canRegister}
                    onRegister={handleRegister}
                    onBatchRegister={ponto.registerAll}
                  />
                )}
                <AdjustmentsTab
                  adjustments={ponto.adjustments}
                  employees={ponto.employees}
                  monthStartDate={ponto.monthStartDate}
                  monthEndDate={ponto.monthEndDate}
                  workDate={ponto.workDate}
                  disabled={ponto.isMonthClosed}
                  onSaveAdjustment={ponto.saveAdjustment}
                />
              </div>
            ) : null}

            {/* ── TAB: Funcionários ── */}
            {!ponto.isLoading && ponto.activeTab === "employees" ? (
              <div className="tab-panel" key="employees">
                <EmployeesTab
                  employees={ponto.employees}
                  onSaveEmployee={ponto.saveEmployee}
                  onToggleEmployeeActive={ponto.toggleEmployeeActive}
                  onDeleteEmployee={ponto.deleteEmployee}
                  onLoadSalaryHistory={ponto.fetchSalaryHistory}
                />
              </div>
            ) : null}

            {/* ── TAB: Fechamento ── */}
            {!ponto.isLoading && ponto.activeTab === "closing" ? (
              <div className="tab-panel" key="closing">
                <div className="sub-tabs" role="tablist">
                  {closingSubTabs.map((sub) => (
                    <button
                      key={sub.key}
                      type="button"
                      role="tab"
                      aria-selected={closingSub === sub.key}
                      className={`sub-tab${closingSub === sub.key ? " active" : ""}`}
                      onClick={() => setClosingSub(sub.key)}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>

                <div className="section-stack">
                  {closingSub === "mirror" ? (
                    <MonthlyMirrorTab
                      employees={ponto.employees}
                      eventsByEmployee={ponto.eventsByEmployee}
                      holidays={ponto.holidays}
                      monthClosing={ponto.monthClosing}
                      monthDates={ponto.monthDates}
                      monthKey={ponto.monthKey}
                      payrollByEmployee={ponto.payrollByEmployee}
                      onCloseMonth={ponto.closeCurrentMonth}
                      onExportCsv={ponto.exportPayrollCsv}
                      onReopenMonth={ponto.reopenCurrentMonth}
                      onOpenHolerites={() => setClosingSub("holerites")}
                    />
                  ) : closingSub === "relatorio" ? (
                    <EmployeeReportTab
                      employees={ponto.employees}
                      eventsByEmployee={ponto.eventsByEmployee}
                      holidays={ponto.holidays}
                      monthDates={ponto.monthDates}
                      monthKey={ponto.monthKey}
                      payrollByEmployee={ponto.payrollByEmployee}
                    />
                  ) : closingSub === "esocial" ? (
                    <EsocialTab
                      employees={ponto.employees}
                      payrollByEmployee={ponto.payrollByEmployee}
                      monthKey={ponto.monthKey}
                      settings={ponto.appSettings}
                      onSaveSettings={ponto.updateAppSettings}
                      onGenerate={ponto.generateEsocial}
                    />
                  ) : (
                    <HoleriteTab
                      employees={ponto.employees}
                      payrollByEmployee={ponto.payrollByEmployee}
                      monthKey={ponto.monthKey}
                      holidays={ponto.holidays}
                      companyName={companyName}
                      companyCnpj={companyCnpj}
                      onGenerate={ponto.generateHoleritePdf}
                    />
                  )}
                </div>
              </div>
            ) : null}

            {/* ── TAB: Banco de Horas ── */}
            {!ponto.isLoading && ponto.activeTab === "bank" ? (
              <div className="tab-panel" key="bank">
                <HourBankTab
                  employees={ponto.employees}
                  hourBankEntries={ponto.hourBankEntries}
                  payrollByEmployee={ponto.payrollByEmployee}
                  monthKey={ponto.monthKey}
                  onAddEntry={ponto.addHourBank}
                  onDeleteEntry={ponto.removeHourBank}
                />
              </div>
            ) : null}

            {/* ── TAB: Ordens de Serviço ── */}
            {!ponto.isLoading && ponto.activeTab === "orders" ? (
              <div className="tab-panel" key="orders">
                <WorkOrderTab
                  employees={ponto.employees}
                  workOrders={ponto.workOrders}
                  onSave={ponto.saveWorkOrder}
                  onDelete={ponto.removeWorkOrder}
                  onGetNextNumber={ponto.fetchNextWorkOrderNumber}
                />
              </div>
            ) : null}

            {/* ── TAB: Configurações ── */}
            {!ponto.isLoading && ponto.activeTab === "settings" ? (
              <div className="section-stack tab-panel" key="settings">
                <AppConfigTab
                  settings={ponto.appSettings}
                  onSave={ponto.updateAppSettings}
                  onBackupData={ponto.backupData}
                  onRestoreData={ponto.restoreData}
                />
                <HolidaysTab
                  holidays={ponto.holidays}
                  monthStartDate={ponto.monthStartDate}
                  monthEndDate={ponto.monthEndDate}
                  workDate={ponto.workDate}
                  disabled={ponto.isMonthClosed}
                  onSaveHoliday={ponto.saveHoliday}
                  onRemoveHoliday={ponto.removeHoliday}
                />
                <PayrollRulesTab monthStartDate={ponto.monthStartDate} />
                <HistoryTab auditLogs={ponto.auditLogs} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Toaster
        position="bottom-right"
        theme={currentTheme}
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
      />
    </div>
  );
}
