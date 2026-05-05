import { useEffect, useRef, useState } from "react";
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
import { SummaryTab } from "./components/SummaryTab";
import { WorkOrderTab } from "./components/WorkOrderTab";
import type { TabKey } from "./pontoPageShared";
import { usePontoPageState } from "./usePontoPageState";

/* ─── SVG Icons ─────────────────────────────────────────── */
function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

/* ─── Nav config ─────────────────────────────────────────── */
const navItems: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "today",     label: "Hoje",              icon: <IconClock />,     desc: "Registro de ponto diário" },
  { key: "employees", label: "Funcionários",       icon: <IconUsers />,     desc: "Cadastro e contratos" },
  { key: "closing",   label: "Fechamento",         icon: <IconChart />,     desc: "Folha, espelho e eSocial" },
  { key: "bank",      label: "Banco de Horas",     icon: <IconLayers />,    desc: "Saldo e compensações" },
  { key: "orders",    label: "Ordens de Serviço",  icon: <IconClipboard />, desc: "OS abertas e concluídas" },
  { key: "settings",  label: "Configurações",      icon: <IconSettings />,  desc: "Empresa, feriados e regras" },
];

/* ─── Toast ──────────────────────────────────────────────── */
interface ToastItem {
  id: number;
  msg: string;
  type: "error" | "success";
  action?: { label: string; onClick: () => void };
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">
            {t.type === "success"
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </span>
          <span className="toast-msg">{t.msg}</span>
          {t.action ? (
            <button type="button" className="toast-action" onClick={() => { t.action!.onClick(); onDismiss(t.id); }}>
              {t.action.label}
            </button>
          ) : null}
          <button type="button" className="toast-close" onClick={() => onDismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ─── Date helpers ───────────────────────────────────────── */
function shiftDate(dateKey: string, days: number) {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function shiftMonth(monthKey: string, months: number) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ─── Closing sub-tabs ───────────────────────────────────── */
type ClosingSub = "mirror" | "relatorio" | "esocial" | "holerites";

export default function PontoPage() {
  const ponto = usePontoPageState();
  const [closingSub, setClosingSub] = useState<ClosingSub>("mirror");

  /* ── Toasts ── */
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  function addToast(msg: string, type: ToastItem["type"], action?: ToastItem["action"]) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type, action }]);
    const duration = action ? 6000 : 4200;
    const timer = setTimeout(() => dismissToast(id), duration);
    toastTimers.current.set(id, timer);
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id); }
  }

  useEffect(() => { if (ponto.error) addToast(ponto.error, "error"); }, [ponto.error]);
  useEffect(() => { if (ponto.successMessage) addToast(ponto.successMessage, "success"); }, [ponto.successMessage]);

  async function handleRegister(employeeId: string, type: "IN" | "OUT") {
    const ev = await ponto.register(employeeId, type);
    if (ev) {
      const label = type === "IN" ? "Entrada" : "Saída";
      const eventId = ev.id;
      addToast(`${label} registrada.`, "success", {
        label: "Desfazer",
        onClick: () => ponto.undoRegister(eventId),
      });
    }
  }

  /* ── Theme toggle ── */
  const currentTheme = ponto.appSettings.theme ?? "system";
  function toggleTheme() {
    const next = currentTheme === "dark" ? "light" : "dark";
    applyTheme(next);
    ponto.updateSingleSetting("theme", next).catch(() => {});
  }

  /* ── Keyboard shortcuts ── */
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
      {/* ── Onboarding overlay ── */}
      {ponto.showOnboarding ? (
        <OnboardingWizard
          onStart={() => {
            ponto.setShowOnboarding(false);
            ponto.setActiveTab("employees");
          }}
        />
      ) : null}

      {/* ═══════════════════════════════════
          SIDEBAR
      ════════════════════════════════════ */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">JF</div>
          <div style={{ minWidth: 0 }}>
            <div className="brand-name">JFM Manager</div>
            <div className="brand-sub">{companyName}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => (
            <button
              key={item.key}
              type="button"
              className={`nav-item${ponto.activeTab === item.key ? " active" : ""}`}
              onClick={() => ponto.setActiveTab(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <span className="nav-kbd">{idx + 1}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div
            className={ponto.isMonthClosed ? "status-pill status-closed" : "status-pill status-open"}
            style={{ fontSize: 11, padding: "3px 10px" }}
          >
            {ponto.isMonthClosed ? "Competência fechada" : "Competência aberta"}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--disabled)" }}>
            Competência {ponto.monthKey}
          </div>
          <button
            type="button"
            title={currentTheme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            onClick={toggleTheme}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px", borderRadius: "var(--r)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, transition: "color var(--t)" }}
          >
            {currentTheme === "dark"
              ? /* sun */ <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : /* moon */ <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════
          MAIN AREA
      ════════════════════════════════════ */}
      <div className="main-area">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="topbar-left">
            <div>
              <div className="page-title">{activeNav?.label ?? "Ponto"}</div>
              {activeNav?.desc ? (
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>{activeNav.desc}</div>
              ) : null}
            </div>
          </div>

          <div className="topbar-right">
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Competência</span>
              <button type="button" className="nav-arrow" onClick={() => ponto.changeMonth(shiftMonth(ponto.monthKey, -1))} title="Mês anterior">‹</button>
              <input
                type="month"
                value={ponto.monthKey}
                onChange={(e) => ponto.changeMonth(e.target.value)}
                style={{ fontSize: 12.5, padding: "5px 9px" }}
              />
              <button type="button" className="nav-arrow" onClick={() => ponto.changeMonth(shiftMonth(ponto.monthKey, 1))} title="Próximo mês">›</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>Data</span>
              <button type="button" className="nav-arrow" onClick={() => ponto.changeWorkDate(shiftDate(ponto.workDate, -1))} title="Dia anterior">‹</button>
              <input
                type="date"
                value={ponto.workDate}
                onChange={(e) => ponto.changeWorkDate(e.target.value)}
                style={{ fontSize: 12.5, padding: "5px 9px" }}
              />
              <button type="button" className="nav-arrow" onClick={() => ponto.changeWorkDate(shiftDate(ponto.workDate, 1))} title="Próximo dia">›</button>
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="content-area">
          {/* disclaimer */}
          <div className="notice" role="note" style={{ marginBottom: 18 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Valores estimados. Confirme fechamento de folha, convenção coletiva e encargos com a contabilidade.</span>
          </div>

          {/* toasts handled by ToastContainer (fixed, bottom-right) */}

          {/* loading */}
          {ponto.isLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 13, padding: "32px 0" }}>
              <div className="loading-dot" />
              <div className="loading-dot" style={{ animationDelay: "0.2s" }} />
              <div className="loading-dot" style={{ animationDelay: "0.4s" }} />
              <span style={{ marginLeft: 4 }}>Carregando...</span>
            </div>
          ) : null}

          {/* closed/past date notice */}
          {!ponto.isLoading && ponto.activeTab === "today" && ponto.employees.length > 0 && !ponto.canRecordForDate ? (
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--r)", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {ponto.isMonthClosed ? "Competência fechada — somente consulta." : "Data anterior — somente consulta."}
            </div>
          ) : null}

          {/* ── TAB: Hoje ── */}
          {!ponto.isLoading && ponto.activeTab === "today" ? (
            <div className="section-stack">
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
                  <div className="empty-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h3>Nenhum funcionário cadastrado</h3>
                  <p>Cadastre os funcionários antes de começar a registrar o ponto diário.</p>
                  <button type="button" onClick={() => ponto.setActiveTab("employees")}>
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
                  onEditEmployee={ponto.editEmployee}
                  onToggleEmployeeActive={ponto.toggleEmployeeActive}
                />
              )}
              <AdjustmentsTab
                adjustmentForm={ponto.adjustmentForm}
                adjustments={ponto.adjustments}
                employees={ponto.employees}
                monthStartDate={ponto.monthStartDate}
                monthEndDate={ponto.monthEndDate}
                disabled={ponto.isMonthClosed}
                onSaveAdjustment={ponto.saveAdjustment}
                onUpdateAdjustmentForm={ponto.updateAdjustmentForm}
              />
            </div>
          ) : null}

          {/* ── TAB: Funcionários ── */}
          {!ponto.isLoading && ponto.activeTab === "employees" ? (
            <EmployeesTab
              employeeForm={ponto.employeeForm}
              editingEmployeeId={ponto.editingEmployeeId}
              employees={ponto.employees}
              onSaveEmployee={ponto.saveEmployee}
              onUpdateForm={ponto.updateEmployeeForm}
              onToggleWorkDay={ponto.toggleWorkDay}
              onResetEmployeeForm={ponto.resetEmployeeForm}
              onEditEmployee={ponto.editEmployee}
              onToggleEmployeeActive={ponto.toggleEmployeeActive}
              onDeleteEmployee={ponto.deleteEmployee}
              onLoadSalaryHistory={ponto.fetchSalaryHistory}
            />
          ) : null}

          {/* ── TAB: Fechamento ── */}
          {!ponto.isLoading && ponto.activeTab === "closing" ? (
            <div>
              {/* sub-tabs */}
              <div className="sub-tabs">
                {([
                  { key: "mirror",    label: "Espelho" },
                  { key: "relatorio", label: "Relatório" },
                  { key: "esocial",   label: "eSocial" },
                  { key: "holerites", label: "Holerites" },
                ] as { key: ClosingSub; label: string }[]).map((sub) => (
                  <button
                    key={sub.key}
                    type="button"
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
            <HourBankTab
              employees={ponto.employees}
              hourBankEntries={ponto.hourBankEntries}
              payrollByEmployee={ponto.payrollByEmployee}
              monthKey={ponto.monthKey}
              onAddEntry={ponto.addHourBank}
              onDeleteEntry={ponto.removeHourBank}
            />
          ) : null}

          {/* ── TAB: Ordens de Serviço ── */}
          {!ponto.isLoading && ponto.activeTab === "orders" ? (
            <WorkOrderTab
              employees={ponto.employees}
              workOrders={ponto.workOrders}
              onSave={ponto.saveWorkOrder}
              onDelete={ponto.removeWorkOrder}
              onGetNextNumber={ponto.fetchNextWorkOrderNumber}
            />
          ) : null}

          {/* ── TAB: Configurações ── */}
          {!ponto.isLoading && ponto.activeTab === "settings" ? (
            <div className="section-stack">
              <AppConfigTab
                settings={ponto.appSettings}
                onSave={ponto.updateAppSettings}
                onBackupData={ponto.backupData}
                onRestoreData={ponto.restoreData}
              />
              <HolidaysTab
                holidayForm={ponto.holidayForm}
                holidays={ponto.holidays}
                monthStartDate={ponto.monthStartDate}
                monthEndDate={ponto.monthEndDate}
                disabled={ponto.isMonthClosed}
                onSaveHoliday={ponto.saveHoliday}
                onSetHolidayForm={(updater) => ponto.setHolidayForm(updater)}
                onRemoveHoliday={ponto.removeHoliday}
              />
              <PayrollRulesTab monthStartDate={ponto.monthStartDate} />
              <HistoryTab auditLogs={ponto.auditLogs} />
            </div>
          ) : null}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
