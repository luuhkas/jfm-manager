interface MetricProps {
  label: string;
  value: string;
  accent?: boolean;
  success?: boolean;
  danger?: boolean;
  small?: boolean;
}

export function Metric({ label, value, accent, success, danger, small }: MetricProps) {
  const valueColor = accent
    ? "var(--accent)"
    : success
    ? "var(--success)"
    : danger
    ? "var(--danger)"
    : "var(--text)";

  const cardStyle = accent
    ? { borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)", background: "var(--accent-bg)" }
    : success
    ? { borderColor: "color-mix(in srgb, var(--success) 25%, transparent)", background: "var(--success-bg)" }
    : danger
    ? { borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)", background: "var(--danger-bg)" }
    : undefined;

  return (
    <div className="metric-card" style={cardStyle}>
      <div className="metric-label">{label}</div>
      <div
        className="metric-value"
        style={{
          color: valueColor,
          fontSize: small ? "1rem" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
