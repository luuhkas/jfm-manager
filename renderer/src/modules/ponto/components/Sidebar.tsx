import { BarChart3, ClipboardList, Clock, Layers, Moon, Settings, Sun, Users } from "lucide-react";
import type { TabKey } from "../pontoPageShared";

export const navItems: { key: TabKey; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "today",     label: "Hoje",              icon: <Clock size={15} />,         desc: "Registro de ponto diário" },
  { key: "employees", label: "Funcionários",      icon: <Users size={15} />,         desc: "Cadastro e contratos" },
  { key: "closing",   label: "Fechamento",        icon: <BarChart3 size={15} />,     desc: "Folha, espelho e eSocial" },
  { key: "bank",      label: "Banco de Horas",    icon: <Layers size={15} />,        desc: "Saldo e compensações" },
  { key: "orders",    label: "Ordens de Serviço", icon: <ClipboardList size={15} />, desc: "OS abertas e concluídas" },
  { key: "settings",  label: "Configurações",     icon: <Settings size={15} />,      desc: "Empresa, feriados e regras" },
];

interface SidebarProps {
  activeTab: TabKey;
  companyName: string;
  monthKey: string;
  isMonthClosed: boolean;
  theme: "dark" | "light" | "system";
  onSelectTab: (tab: TabKey) => void;
  onToggleTheme: () => void;
}

export function Sidebar({
  activeTab,
  companyName,
  monthKey,
  isMonthClosed,
  theme,
  onSelectTab,
  onToggleTheme,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">JF</div>
        <div style={{ minWidth: 0 }}>
          <div className="brand-name">JFM Manager</div>
          <div className="brand-sub">{companyName}</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {navItems.map((item, idx) => (
          <button
            key={item.key}
            type="button"
            className={`nav-item${activeTab === item.key ? " active" : ""}`}
            aria-current={activeTab === item.key ? "page" : undefined}
            onClick={() => onSelectTab(item.key)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            <span className="nav-kbd" aria-hidden="true">{idx + 1}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className={`status-pill ${isMonthClosed ? "status-closed" : "status-open"}`}>
          {isMonthClosed ? "Competência fechada" : "Competência aberta"}
        </div>
        <div className="sidebar-competencia">Competência {monthKey}</div>
        <button
          type="button"
          className="theme-toggle"
          title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
          onClick={onToggleTheme}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </aside>
  );
}
