import type { AuditLog } from "../pontoTypes";

interface HistoryTabProps {
  auditLogs: AuditLog[];
}

const entityLabels: Record<string, string> = {
  employee: "Funcionário",
  holiday: "Feriado",
  month_closing: "Competência",
  time_adjustment: "Ajuste",
  time_event: "Ponto",
};

const actionLabels: Record<string, string> = {
  close: "Fechamento",
  create: "Criação",
  delete: "Remoção",
  reopen: "Reabertura",
  upsert: "Salvo",
};

export function HistoryTab({ auditLogs }: HistoryTabProps) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 className="section-title spaced">Histórico</h2>

      {auditLogs.length === 0 ? (
        <div style={{ opacity: 0.75 }}>Nenhuma alteração registrada nesta competência.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {auditLogs.slice(0, 30).map((log) => (
            <div
              key={log.id}
              style={{
                display: "grid",
                gap: 4,
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 12,
                background: "var(--surface)",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong>{entityLabels[log.entity] ?? log.entity}</strong>
                <span className="status-pill">{actionLabels[log.action] ?? log.action}</span>
                <span style={{ opacity: 0.72 }}>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <div>{log.description}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
