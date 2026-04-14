import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <section className="auth-shell">
      <aside className="auth-visual-panel">
        <div className="auth-visual-frame">
          <img
            src="/login-side-image.jpg"
            alt="City buildings"
            className="auth-visual-image"
          />
          <div className="auth-visual-overlay" />
        </div>
      </aside>
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-brand">
            <img src="/IET-logo.png" alt="Institution of Engineers Tanzania" className="auth-logo" />
            <h1 className="auth-brand-title">Institution of Engineers Tanzania</h1>
          </div>
          <div className="auth-card">
            <Outlet />
          </div>
          <footer className="auth-footer">
            <span aria-hidden="true">©</span> 2025 Institute of Engineers Tanzania
          </footer>
        </div>
      </div>
    </section>
  );
}
