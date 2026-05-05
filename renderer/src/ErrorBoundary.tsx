import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            gap: 16,
            padding: 32,
            background: "var(--bg)",
            color: "var(--text)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--danger-bg)",
              border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
            }}
          >
            ⚠
          </div>
          <h2 style={{ margin: 0, fontSize: 20 }}>Algo deu errado</h2>
          <p
            style={{
              color: "var(--muted)",
              maxWidth: 420,
              textAlign: "center",
              margin: 0,
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}
          >
            {this.state.error?.message ?? "Erro inesperado na interface. Tente reiniciar o aplicativo."}
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reiniciar aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
