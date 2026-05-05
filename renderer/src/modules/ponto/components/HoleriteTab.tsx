import { useState } from "react";
import type { Employee, Holiday, PayrollSummary } from "../pontoTypes";
import { formatCurrencyFromCents, formatMinutes } from "../pontoUtils";
import { getLaborRulesForDate } from "../laborRules";

interface HoleriteTabProps {
  employees: Employee[];
  payrollByEmployee: Map<string, PayrollSummary>;
  monthKey: string;
  holidays: Holiday[];
  companyName: string;
  companyCnpj: string;
  onGenerate: (payload: { html: string; filename: string }) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>;
}

function buildHoleriteHtml(
  employee: Employee,
  payroll: PayrollSummary,
  monthKey: string,
  companyName: string,
  companyCnpj: string
): string {
  const rules = getLaborRulesForDate(`${monthKey}-01`);

  function row(label: string, value: string, bold = false, color = "#111"): string {
    return `<tr>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;color:#374151">${label}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:${bold ? "700" : "400"};color:${color}">${value}</td>
    </tr>`;
  }

  const c = formatCurrencyFromCents;
  const m = formatMinutes;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #1e40af; margin-bottom: 20px; }
  .company { font-size: 18px; font-weight: 800; color: #1e40af; }
  .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .pill { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
  .info-item label { display: block; font-size: 10px; text-transform: uppercase; color: #9ca3af; font-weight: 700; letter-spacing: .04em; margin-bottom: 2px; }
  .info-item span { font-weight: 600; font-size: 13px; }
  h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 800; letter-spacing: .06em; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .total-row td { font-weight: 700; background: #f3f4f6; font-size: 14px; }
  .net-row td { font-weight: 800; background: #eff6ff; color: #1e40af; font-size: 15px; }
  .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sign-line { border-top: 1px solid #374151; padding-top: 6px; width: 200px; font-size: 11px; color: #6b7280; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${companyName || "JF Mecatrônica"}</div>
      ${companyCnpj ? `<div class="subtitle">CNPJ: ${companyCnpj}</div>` : ""}
      <div class="subtitle">Holerite de Salário</div>
    </div>
    <div style="text-align:right">
      <div class="pill">Competência ${monthKey}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:6px">Gerado em ${new Date().toLocaleDateString("pt-BR")}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item"><label>Funcionário</label><span>${employee.name}</span></div>
    <div class="info-item"><label>CPF</label><span>${employee.cpf || "—"}</span></div>
    <div class="info-item"><label>Cargo</label><span>${employee.role || "—"}</span></div>
    <div class="info-item"><label>Admissão</label><span>${employee.admissionDate ? new Date(employee.admissionDate + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</span></div>
    <div class="info-item"><label>Tipo de contrato</label><span>${employee.contract?.paymentType === "hourly" ? "Horista" : "Mensalista"}</span></div>
    <div class="info-item"><label>Jornada</label><span>${m(payroll.expectedMinutes)}</span></div>
  </div>

  <h3>Proventos</h3>
  <table>
    ${row("Salário base", c(payroll.baseSalaryCents))}
    ${payroll.overtimeCents > 0 ? row("Horas extras (" + m(payroll.overtimeMinutes) + ")", c(payroll.overtimeCents)) : ""}
    ${payroll.nightBonusCents > 0 ? row("Adicional noturno (" + m(payroll.nightMinutes) + ")", c(payroll.nightBonusCents)) : ""}
    ${payroll.dsrCents > 0 ? row("DSR (descanso semanal remunerado)", c(payroll.dsrCents)) : ""}
    <tr class="total-row">
      <td style="padding:8px 10px;">Total de proventos</td>
      <td style="padding:8px 10px;text-align:right">${c(payroll.grossCents)}</td>
    </tr>
  </table>

  <h3>Descontos</h3>
  <table>
    ${payroll.missingDiscountCents > 0 ? row("Desconto faltas/atrasos (" + m(payroll.missingMinutes) + ")", "- " + c(payroll.missingDiscountCents), false, "#dc2626") : ""}
    ${row("INSS empregado", "- " + c(payroll.inssDiscountCents), false, "#dc2626")}
    ${payroll.irrfDiscountCents > 0 ? row("IRRF", "- " + c(payroll.irrfDiscountCents), false, "#dc2626") : ""}
    <tr class="total-row">
      <td style="padding:8px 10px;">Total de descontos</td>
      <td style="padding:8px 10px;text-align:right;color:#dc2626">- ${c(payroll.inssDiscountCents + payroll.irrfDiscountCents + payroll.missingDiscountCents)}</td>
    </tr>
  </table>

  <table>
    <tr class="net-row">
      <td style="padding:10px 10px;border-radius:8px 0 0 8px">SALÁRIO LÍQUIDO ESTIMADO</td>
      <td style="padding:10px 10px;text-align:right;border-radius:0 8px 8px 0">${c(payroll.netEstimateCents)}</td>
    </tr>
  </table>

  <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:11px;color:#92400e">
    Valores estimados com base nas marcações e regras cadastradas (CLT ${rules.effectiveFrom.slice(0,4)}). Confirme com a contabilidade antes do pagamento.
  </div>

  <div class="footer">
    <div class="sign-line">Assinatura do funcionário</div>
    <div class="sign-line">Responsável — ${companyName || "Empresa"}</div>
  </div>
</body>
</html>`;
}

export function HoleriteTab({
  employees,
  payrollByEmployee,
  monthKey,
  companyName,
  companyCnpj,
  onGenerate,
}: HoleriteTabProps) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);

  async function handleGenerate(emp: Employee) {
    const p = payrollByEmployee.get(emp.id);
    if (!p) return;
    setError(null);
    setResult(null);

    try {
      const html = buildHoleriteHtml(emp, p, monthKey, companyName, companyCnpj);
      const res = await onGenerate({ html, filename: `holerite-${emp.name.replace(/\s+/g, "-")}-${monthKey}.pdf` });
      if (res.success) setResult(`Holerite de ${emp.name} salvo em ${res.filePath}`);
      else if (!res.canceled) setError("Erro ao gerar PDF.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar holerite.");
    }
  }

  async function handleGenerateAll() {
    setGeneratingAll(true);
    setError(null);
    setResult(null);
    let count = 0;
    for (const emp of employees.filter((e) => e.active)) {
      const p = payrollByEmployee.get(emp.id);
      if (!p) continue;
      try {
        const html = buildHoleriteHtml(emp, p, monthKey, companyName, companyCnpj);
        const res = await onGenerate({ html, filename: `holerite-${emp.name.replace(/\s+/g, "-")}-${monthKey}.pdf` });
        if (res.success) count++;
        if (res.canceled) break;
      } catch { /* continue to next */ }
    }
    setResult(count > 0 ? `${count} holerite(s) gerado(s).` : null);
    setGeneratingAll(false);
  }

  return (
    <section>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, margin: "0 0 4px" }}>Holerites — {monthKey}</h2>
          <div style={{ color: "var(--muted)" }}>Gere o recibo de salário individual para cada funcionário.</div>
        </div>
        <button type="button" onClick={handleGenerateAll} disabled={generatingAll || employees.filter(e => e.active).length === 0}>
          {generatingAll ? "Gerando..." : "Gerar todos os holerites"}
        </button>
      </div>

      {result ? <div style={{ background: "var(--success-bg)", border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)", color: "var(--success)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>{result}</div> : null}
      {error ? <div style={{ background: "var(--danger-bg)", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)", color: "var(--danger)", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>{error}</div> : null}

      <div style={{ display: "grid", gap: 10 }}>
        {employees.filter((e) => e.active).map((emp) => {
          const p = payrollByEmployee.get(emp.id);
          if (!p) return null;
          return (
            <div
              key={emp.id}
              style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16, background: "var(--surface-soft)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}
            >
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 700 }}>{emp.name}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{emp.role || "—"} · CPF {emp.cpf || "—"}</div>
                <div style={{ fontSize: "0.85rem", display: "flex", gap: 14, flexWrap: "wrap", marginTop: 4 }}>
                  <span>Bruto: <b>{formatCurrencyFromCents(p.grossCents)}</b></span>
                  <span>INSS: {formatCurrencyFromCents(p.inssDiscountCents)}</span>
                  <span>IRRF: {formatCurrencyFromCents(p.irrfDiscountCents)}</span>
                  <span>Líquido: <b style={{ color: "var(--accent)" }}>{formatCurrencyFromCents(p.netEstimateCents)}</b></span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleGenerate(emp)}
                disabled={generatingAll}
                style={{ whiteSpace: "nowrap" }}
              >
                Gerar PDF
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
