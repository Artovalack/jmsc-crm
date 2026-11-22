import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/app/actions";
import Notice from "@/components/notice";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const { error, message } = await searchParams;

  return (
    <div className="auth-card">
      <span className="eyebrow">WELCOME BACK</span>
      <h2>Sign in to your studio.</h2>
      <p className="auth-intro">Pick up where the team left off.</p>
      <Notice error={error} message={message} />
      <form action={signIn} className="form-stack">
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
        <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
        <button className="button button-primary button-wide" type="submit">Sign in</button>
      </form>
      <p className="auth-switch">New to the workspace? <Link href="/signup">Request an account</Link></p>
      <p className="auth-footnote">Accounts require approval by a JMSC workspace administrator.</p>
    </div>
  );
}
