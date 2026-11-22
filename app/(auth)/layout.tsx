import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link className="wordmark wordmark-light" href="/">
          <Image className="brand-logo brand-logo-auth" src="/jmsc-logo.png" alt="JMSC Media Works" width={150} height={163} priority />
        </Link>
        <div className="auth-aside-copy">
          <span className="eyebrow eyebrow-light">DAVAO CITY · CREATIVE OPERATIONS</span>
          <h1>Good work,<br /><em>in good hands.</em></h1>
          <p>One calm place for the people, projects, and print partners behind every good idea.</p>
        </div>
        <span className="auth-aside-foot">KEEP CREATING.</span>
      </div>
      <section className="auth-card-wrap">{children}</section>
    </main>
  );
}
