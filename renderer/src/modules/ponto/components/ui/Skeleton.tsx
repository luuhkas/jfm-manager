/* Skeleton screens exibidos enquanto os dados do dia carregam. */

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div className="skeleton" style={{ width: 38, height: 38, borderRadius: "50%" }} />
        <div style={{ display: "grid", gap: 6, flex: 1 }}>
          <div className="skeleton" style={{ height: 13, width: "34%" }} />
          <div className="skeleton" style={{ height: 10, width: "55%" }} />
        </div>
        <div className="skeleton" style={{ height: 30, width: 180 }} />
      </div>
      <div className="skeleton" style={{ height: 34 }} />
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="section-stack" role="status" aria-label="Carregando dados">
      <div style={{ display: "flex", gap: 10 }}>
        {[92, 118, 132, 110].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 32, width: w, borderRadius: "var(--r-md)" }} />
        ))}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
