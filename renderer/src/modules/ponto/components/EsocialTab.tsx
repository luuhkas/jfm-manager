import { useState } from "react";
import type { AppSettings, Employee, EsocialRemuneracao, PayrollSummary } from "../pontoTypes";
import { formatCurrencyFromCents } from "../pontoUtils";

interface EsocialTabProps {
  employees: Employee[];
  payrollByEmployee: Map<string, PayrollSummary>;
  monthKey: string;
  settings: AppSettings;
  onSaveSettings: (s: Partial<AppSettings>) => Promise<void>;
  onGenerate: (payload: {
    competencia: string;
    empregador: { cnpj: string; cpfResponsavel?: string };
    remuneracoes: EsocialRemuneracao[];
  }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>;
}

export function EsocialTab({
  employees,
  payrollByEmployee,
  monthKey,
  settings,
  onSaveSettings,
  onGenerate,
}: EsocialTabProps) {
  const [cnpj, setCnpj] = useState(settings.companyCnpj ?? "");
  const [cpfResp, setCpfResp] = useState(settings.companyCpfResponsavel ?? "");
  const [companyName, setCompanyName] = useState(settings.companyName ?? "JF Mecatrônica");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeEmployees = employees.filter((e) => e.active && e.contract);

  function buildRemuneracoes(): EsocialRemuneracao[] {
    return activeEmployees.map((emp) => {
      const payroll = payrollByEmployee.get(emp.id);
      return {
        cpf: emp.cpf,
        nome: emp.name,
        salarioBrutoCents: payroll?.grossCents ?? 0,
        extraCents: payroll?.overtimeCents ?? 0,
        noturnoCents: payroll?.nightBonusCents ?? 0,
        dsrCents: payroll?.dsrCents ?? 0,
        inssCents: payroll?.inssDiscountCents ?? 0,
        irrfCents: payroll?.irrfDiscountCents ?? 0,
        diasTrabalhados: payroll?.workedDays ?? 0,
      };
    });
  }

  async function handleSaveConfig(evt: React.FormEvent) {
    evt.preventDefault();
    await onSaveSettings({ companyCnpj: cnpj, companyCpfResponsavel: cpfResp, companyName });
    setResult("Configurações salvas.");
  }

  async function handleGenerate() {
    if (!cnpj.replace(/\D/g, "")) {
      setError("Configure o CNPJ da empresa antes de gerar.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const res = await onGenerate({
        competencia: monthKey,
        empregador: { cnpj: cnpj.replace(/\D/g, ""), cpfResponsavel: cpfResp.replace(/\D/g, "") },
        remuneracoes: buildRemuneracoes(),
      });
      if (res.success) setResult(`Arquivo salvo em: ${res.filePath}`);
      else if (!res.canceled) setError("Erro ao gerar arquivo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar eSocial.");
    } finally {
      setGenerating(false);
    }
  }

  const remuneracoes = buildRemuneracoes();
  const totalBruto = remuneracoes.reduce((s, r) => s + r.salarioBrutoCents, 0);
  const totalInss = remuneracoes.reduce((s, r) => s + r.inssCents, 0);

  return (
    <section>
      <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>eSocial — S-1200</h2>
      <p style={{ color: "var(--muted)", margin: "0 0 20px" }}>
        Exportação de remuneração mensal (S-1200) para a competência {monthKey}.
        Confira os dados com sua contabilidade antes de transmitir.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 18, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px" }}>Dados da empresa</h3>
          {result ? <div style={{ color: "var(--success)", marginBottom: 10, fontSize: "0.88rem" }}>{result}</div> : null}
          <form onSubmit={handleSaveConfig} style={{ display: "grid", gap: 12 }}>
            <label className="field-label">
              Razão Social
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="JF Mecatrônica" />
            </label>
            <label className="field-label">
              CNPJ
              <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
            </label>
            <label className="field-label">
              CPF do Responsável
              <input value={cpfResp} onChange={(e) => setCpfResp(e.target.value)} placeholder="000.000.000-00" />
            </label>
            <button type="submit" style={{ justifySelf: "start" }}>Salvar configuração</button>
          </form>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 18, background: "var(--surface-soft)" }}>
          <h3 style={{ margin: "0 0 14px" }}>Prévia da competência</h3>
          <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Funcionários</span>
              <b>{activeEmployees.length}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Total bruto</span>
              <b>{formatCurrencyFromCents(totalBruto)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Total INSS empregados</span>
              <b>{formatCurrencyFromCents(totalInss)}</b>
            </div>
          </div>
          {error ? <div style={{ color: "var(--danger)", marginBottom: 10, fontSize: "0.88rem" }}>{error}</div> : null}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || activeEmployees.length === 0}
            style={{ width: "100%", background: "var(--accent-strong)", color: "#fff", border: "none" }}
          >
            {generating ? "Gerando XML..." : `Gerar S-1200 (${activeEmployees.length} trabalhadores)`}
          </button>
          <div style={{ marginTop: 10, fontSize: "0.8rem", color: "var(--muted)" }}>
            Arquivo XML compatível com eSocial v2.01. Validar no ambiente de produção antes de transmitir.
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Funcionário", "CPF", "Bruto", "Extras", "Noturno", "INSS", "IRRF", "Líq. est."].map((h) => (
                <th key={h} style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {remuneracoes.map((r) => {
              const emp = employees.find((e) => e.cpf === r.cpf);
              const payroll = emp ? payrollByEmployee.get(emp.id) : null;
              return (
                <tr key={r.cpf}>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{r.nome}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8, fontFamily: "monospace" }}>{r.cpf}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{formatCurrencyFromCents(r.salarioBrutoCents)}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{formatCurrencyFromCents(r.extraCents)}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{formatCurrencyFromCents(r.noturnoCents)}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{formatCurrencyFromCents(r.inssCents)}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>{formatCurrencyFromCents(r.irrfCents)}</td>
                  <td style={{ borderBottom: "1px solid var(--border)", padding: 8 }}>
                    <b>{formatCurrencyFromCents(payroll?.netEstimateCents ?? 0)}</b>
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
