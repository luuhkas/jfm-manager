interface MetricProps {
  label: string;
  value: string;
  accent?: boolean;
  success?: boolean;
  danger?: boolean;
  small?: boolean;
}

export function Metric({ label, value, accent, success, danger, small }: MetricProps) {
  const variant = accent ? " accent" : success ? " success" : danger ? " danger" : "";
  return (
    <div className={`metric-card${variant}`}>
      <div className="metric-label">{label}</div>
      <div className={`metric-value${small ? " small" : ""}`}>{value}</div>
    </div>
  );
}
