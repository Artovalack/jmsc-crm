import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link className="wordmark wordmark-light" href="/">
          <span className="wordmark-mark">JM<span>.</span></span>
          <span><strong>JMSC</strong><small>MEDIA WORKS</small></span>
        </Link>
        <div className="auth-aside-copy">
          <span className="eyebrow eyebrow-light">DAVAO CITY · CREATIVE OPERATIONS</span>
          <h1>Good work,<br /><em>in good hands.</em></h1>
          <p>One calm place for the people, projects, and print partners behind every good idea.</p>
        </div>
        <span className="auth-aside-foot">BE PROFESSIONAL. STAY HUMAN. KEEP CREATING.</span>
      </div>
      <section className="auth-card-wrap">{children}</section>
    </main>
  );
}
