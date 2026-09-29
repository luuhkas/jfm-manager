import { getLaborRulesForDate } from "../laborRules";
import { formatCurrencyFromCents } from "../pontoUtils";

interface PayrollRulesTabProps {
  monthStartDate: string;
}

export function PayrollRulesTab({ monthStartDate }: PayrollRulesTabProps) {
  const rules = getLaborRulesForDate(monthStartDate);

  return (
    <section style={{ marginBottom: 20 }}>
      <h2 className="section-title spaced">Regras da folha</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {[
          ["Vigência", `Desde ${rules.effectiveFrom}`],
          ["Hora extra mínima", `${rules.overtimeMinimumPercent}%`],
          ["Adicional noturno mínimo", `${rules.nightMinimumPercent}%`],
          ["Período noturno", `${rules.nightStartHour}h às ${rules.nightEndHour}h`],
          ["Fator hora noturna", rules.nightHourFactor.toFixed(6)],
          ["Tolerância diária", `${rules.dailyToleranceMinutes} min`],
          ["FGTS patronal", `${rules.fgtsEmployerPercent}%`],
          ["Desconto simplificado IRRF", formatCurrencyFromCents(rules.irrfSimplifiedDeductionLimitCents)],
        ].map(([label, value]) => (
          <div key={label} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 12, background: "var(--surface)" }}>
            <div style={{ opacity: 0.72, fontSize: 13 }}>{label}</div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16 }}>
        <div>
          <h3 style={{ margin: "0 0 8px" }}>INSS empregado</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>Até</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>Alíquota</th>
              </tr>
            </thead>
            <tbody>
              {rules.inssEmployeeBrackets.map((bracket) => (
                <tr key={bracket.upToCents}>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(bracket.upToCents)}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>{bracket.ratePercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 style={{ margin: "0 0 8px" }}>IRRF mensal</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>Base</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>Alíquota</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid var(--border)", padding: 8 }}>Dedução</th>
              </tr>
            </thead>
            <tbody>
              {rules.irrfMonthlyBrackets.map((bracket) => (
                <tr key={`${bracket.upToCents}-${bracket.ratePercent}`}>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {bracket.upToCents === null ? "Acima" : `Até ${formatCurrencyFromCents(bracket.upToCents)}`}
                  </td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>{bracket.ratePercent}%</td>
                  <td style={{ borderBottom: "1px solid var(--border-subtle)", padding: 8 }}>
                    {formatCurrencyFromCents(bracket.deductionCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ opacity: 0.76, marginTop: 16 }}>
        Fonte configurada: {rules.sourceLabel}. Esta tela mostra a regra usada pelo cálculo estimado do sistema.
      </p>
    </section>
  );
}
