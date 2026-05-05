interface OnboardingWizardProps {
  onStart: () => void;
}

const steps = [
  { step: "1", title: "Cadastre os funcionários", desc: "Em Funcionários, adicione nome, CPF, cargo e salário." },
  { step: "2", title: "Configure os feriados",    desc: "Em Configurações, cadastre os feriados do período." },
  { step: "3", title: "Registre o ponto",         desc: "Na aba Hoje, registre entrada e saída de cada funcionário." },
  { step: "4", title: "Feche a competência",      desc: "Em Fechamento, revise a folha e exporte holerites em PDF." },
];

export function OnboardingWizard({ onStart }: OnboardingWizardProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          padding: "36px 40px 32px",
          maxWidth: 500,
          width: "100%",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            display: "inline-grid", placeItems: "center",
            width: 56, height: 56,
            background: "linear-gradient(140deg, var(--accent-strong), var(--accent))",
            borderRadius: "var(--r-lg)",
            color: "#fff", fontWeight: 900, fontSize: 20,
            boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)",
          }}>
            JF
          </div>
        </div>

        <h2 style={{ textAlign: "center", margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
          Bem-vindo ao JFM Manager
        </h2>
        <p style={{ textAlign: "center", color: "var(--muted)", margin: "0 0 28px", fontSize: 13.5 }}>
          Sistema de ponto e folha de pagamento para a JF Mecatrônica.
        </p>

        <div style={{ display: "grid", gap: 8, marginBottom: 28 }}>
          {steps.map((item) => (
            <div
              key={item.step}
              style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                padding: "11px 14px",
                background: "var(--surface-soft)",
                borderRadius: "var(--r)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{
                minWidth: 24, height: 24,
                borderRadius: "50%",
                background: "var(--accent-bg)",
                border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                color: "var(--accent)",
                display: "grid", placeItems: "center",
                fontWeight: 800, fontSize: 12,
                flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 2, color: "var(--text)" }}>{item.title}</div>
                <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="btn-primary"
          style={{ width: "100%", padding: "11px", fontSize: 14, fontWeight: 700, borderRadius: "var(--r-md)" }}
        >
          Começar agora
        </button>
      </div>
    </div>
  );
}
