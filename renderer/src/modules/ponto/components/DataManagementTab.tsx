interface DataManagementTabProps {
  onBackupData: () => void;
  onRestoreData: () => void;
}

export function DataManagementTab({ onBackupData, onRestoreData }: DataManagementTabProps) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, margin: "0 0 12px" }}>Dados</h2>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Como usar</h3>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.65 }}>
            <li>Cadastre os funcionários e confira salário, jornada e dias de trabalho.</li>
            <li>No dia a dia, use Hoje para registrar entrada e saída.</li>
            <li>Se alguém esquecer uma marcação, use Ajustes rápidos e informe o motivo.</li>
            <li>No fim do mês, confira o Relatório individual e o Espelho mensal.</li>
            <li>Depois da conferência, feche a competência e gere um backup.</li>
          </ol>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Backup</h3>
          <p style={{ opacity: 0.76, marginTop: 0 }}>
            Salva uma cópia completa do banco de dados atual em um arquivo SQLite.
          </p>
          <button type="button" onClick={onBackupData}>
            Gerar backup
          </button>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Restauração</h3>
          <p style={{ opacity: 0.76, marginTop: 0 }}>
            Substitui os dados atuais por um backup selecionado e reinicia o aplicativo.
          </p>
          <button type="button" onClick={onRestoreData}>
            Restaurar backup
          </button>
        </div>
      </div>
    </section>
  );
}
