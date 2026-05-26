import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Error Boundary to prevent blank screen on crash
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("SmartBank Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          background: "var(--bg, #0a0a0f)",
          color: "var(--text, #e4e4e7)",
        }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Terjadi Kesalahan</h1>
          <p style={{ opacity: 0.7, maxWidth: "400px", textAlign: "center" }}>
            Aplikasi mengalami error yang tidak terduga. Silakan muat ulang halaman.
          </p>
          <code style={{
            fontSize: "0.8rem",
            background: "rgba(255,255,255,0.05)",
            padding: "0.5rem 1rem",
            borderRadius: "6px",
            maxWidth: "500px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {this.state.error?.message || "Unknown error"}
          </code>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.5rem",
              background: "#1e40af",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
