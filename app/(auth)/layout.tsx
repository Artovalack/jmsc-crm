import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <div className="auth-brand">
          <svg className="auth-brand-mark" viewBox="0 0 48 48" aria-hidden="true">
            <path className="auth-brand-graph-axis" d="M7 39V8M7 39h35" />
            <path className="auth-brand-graph-line" d="m13 31 8-8 7 4 11-14" />
            <circle className="auth-brand-graph-point" cx="13" cy="31" r="2.5" />
            <circle className="auth-brand-graph-point" cx="21" cy="23" r="2.5" />
            <circle className="auth-brand-graph-point" cx="28" cy="27" r="2.5" />
            <circle className="auth-brand-graph-point" cx="39" cy="13" r="2.5" />
          </svg>
          <div className="auth-brand-text">
            <span className="auth-brand-name">JMSC</span>
            <span className="auth-brand-details">
              <span>Media Works</span>
              <span className="auth-brand-crm">CRM</span>
            </span>
          </div>
        </div>
        <div className="auth-aside-copy">
          <span className="eyebrow eyebrow-light">DAVAO CITY · CREATIVE OPERATIONS</span>
          <h1>Good work,<br /><em>in good hands.</em></h1>
          <p>One calm place for the people, projects, and print partners behind every good idea.</p>
        </div>
      </div>
      <section className="auth-card-wrap">{children}</section>
    </main>
  );
}
