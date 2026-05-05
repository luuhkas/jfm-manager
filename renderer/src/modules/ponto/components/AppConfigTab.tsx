import { useState } from "react";
import type { AppSettings } from "../pontoTypes";

interface AppConfigTabProps {
  settings: AppSettings;
  onSave: (s: Partial<AppSettings> & Record<string, string>) => Promise<void>;
  onBackupData: () => void;
  onRestoreData: () => void;
}

export function AppConfigTab({ settings, onSave, onBackupData, onRestoreData }: AppConfigTabProps) {
  const [companyName, setCompanyName] = useState(settings.companyName ?? "JF Mecatrônica");
  const [companyCnpj, setCompanyCnpj] = useState(settings.companyCnpj ?? "");
  const [cpfResp, setCpfResp] = useState(settings.companyCpfResponsavel ?? "");
  const [theme, setTheme] = useState<"dark" | "light" | "system">(settings.theme ?? "system");
  const [autoBackup, setAutoBackup] = useState(settings.autoBackupEnabled === "true");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(evt: React.FormEvent) {
    evt.preventDefault();
    setSaveError(null);
    try {
      await onSave({
        companyName,
        companyCnpj,
        companyCpfResponsavel: cpfResp,
        theme,
        autoBackupEnabled: autoBackup ? "true" : "false",
      });
      applyTheme(theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao salvar configurações.");
    }
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, margin: "0 0 20px" }}>Configurações do sistema</h2>

      <form onSubmit={handleSave} style={{ display: "grid", gap: 24 }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 20, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px", color: "var(--accent)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dados da empresa</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <label className="field-label">
              Razão Social
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="JF Mecatrônica" />
            </label>
            <label className="field-label">
              CNPJ
              <input value={companyCnpj} onChange={(e) => setCompanyCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
            </label>
            <label className="field-label">
              CPF do responsável
              <input value={cpfResp} onChange={(e) => setCpfResp(e.target.value)} placeholder="000.000.000-00" />
            </label>
          </div>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 20, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px", color: "var(--accent)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Aparência</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(["system", "dark", "light"] as const).map((t) => (
              <label
                key={t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: `1px solid ${theme === t ? "var(--accent)" : "var(--border)"}`,
                  background: theme === t ? "var(--accent-bg)" : "transparent",
                  fontWeight: theme === t ? 700 : 400,
                  color: theme === t ? "var(--accent)" : "inherit",
                  transition: "border-color var(--t), background var(--t), color var(--t)",
                }}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => {
                    setTheme(t);
                    applyTheme(t); // preview imediato
                  }}
                  style={{ width: "auto" }}
                />
                {t === "system" ? "Automático (sistema)" : t === "dark" ? "Escuro" : "Claro"}
              </label>
            ))}
          </div>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 20, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px", color: "var(--accent)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Backup automático</h3>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
              style={{ width: "auto" }}
            />
            <span>Ativar backup automático diário</span>
          </label>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Quando ativado, o sistema salva uma cópia do banco de dados diariamente em "Documentos/JFM Backups", mantendo os últimos 30 dias.
          </div>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 20, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px", color: "var(--accent)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Backup manual</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div>
              <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: "0.88rem" }}>Salva uma cópia completa do banco de dados.</p>
              <button type="button" onClick={onBackupData}>Gerar backup agora</button>
            </div>
            <div>
              <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: "0.88rem" }}>Restaura dados de um backup anterior (reinicia o app).</p>
              <button type="button" onClick={onRestoreData}>Restaurar backup</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="submit" style={{ background: "var(--accent-strong)", color: "#fff", border: "none" }}>
            Salvar configurações
          </button>
          {saved ? <span style={{ color: "var(--success)", fontWeight: 600 }}>Salvo!</span> : null}
          {saveError ? <span style={{ color: "var(--danger)", fontSize: "0.88rem" }}>{saveError}</span> : null}
        </div>
      </form>
    </section>
  );
}

export function applyTheme(theme: "dark" | "light" | "system") {
  const root = document.documentElement;
  if (theme === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
}
