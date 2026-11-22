import Link from "next/link";
import Image from "next/image";

export default function SetupNotice() {
  return (
    <main className="setup-page">
      <div className="setup-card">
        <Link className="wordmark" href="/">
          <Image className="brand-logo brand-logo-setup" src="/jmsc-logo.png" alt="JMSC Media Works" width={96} height={104} priority />
        </Link>
        <span className="eyebrow">ONE LAST SETUP STEP</span>
        <h1>Connect your<br /><em>Supabase workspace.</em></h1>
        <p>Copy <code>.env.example</code> to <code>.env.local</code>, add the Supabase project URL and publishable key, then run the SQL migration from the Supabase SQL Editor.</p>
        <div className="setup-steps">
          <div><b>01</b><span>Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>.</span></div>
          <div><b>02</b><span>Run <code>supabase/migrations/202611160001_initial_schema.sql</code>.</span></div>
          <div><b>03</b><span>Create your account, then follow the first-admin bootstrap instructions in the repository README.</span></div>
        </div>
        <a className="button button-primary" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <span>↗</span></a>
      </div>
    </main>
  );
}
