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

interface TopbarProps {
  title: string;
  desc?: string;
  monthKey: string;
  workDate: string;
  onChangeMonth: (monthKey: string) => void;
  onChangeWorkDate: (dateKey: string) => void;
}

export function Topbar({ title, desc, monthKey, workDate, onChangeMonth, onChangeWorkDate }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div>
          <h1 className="page-title">{title}</h1>
          {desc ? <div className="page-desc">{desc}</div> : null}
        </div>
      </div>

      <div className="topbar-right">
        <div className="seg">
          <span className="seg-label">Competência</span>
          <button type="button" className="seg-arrow" onClick={() => onChangeMonth(shiftMonth(monthKey, -1))} title="Mês anterior">‹</button>
          <input type="month" value={monthKey} onChange={(e) => onChangeMonth(e.target.value)} />
          <button type="button" className="seg-arrow" onClick={() => onChangeMonth(shiftMonth(monthKey, 1))} title="Próximo mês">›</button>
        </div>
        <div className="seg">
          <span className="seg-label">Data</span>
          <button type="button" className="seg-arrow" onClick={() => onChangeWorkDate(shiftDate(workDate, -1))} title="Dia anterior">‹</button>
          <input type="date" value={workDate} onChange={(e) => onChangeWorkDate(e.target.value)} />
          <button type="button" className="seg-arrow" onClick={() => onChangeWorkDate(shiftDate(workDate, 1))} title="Próximo dia">›</button>
        </div>
      </div>
    </header>
  );
}
