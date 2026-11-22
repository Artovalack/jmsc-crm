import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "@/app/actions";
import Notice from "@/components/notice";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const { error, message } = await searchParams;

  return (
    <div className="auth-card">
      <span className="eyebrow">JOIN THE TEAM</span>
      <h2>Request workspace access.</h2>
      <p className="auth-intro">Your account will be reviewed by a JMSC administrator before CRM records are available.</p>
      <Notice error={error} message={message} />
      <form action={signUp} className="form-stack">
        <label className="field"><span>Your name</span><input name="full_name" autoComplete="name" maxLength={100} required /></label>
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
        <label className="field"><span>Password</span><input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <button className="button button-primary button-wide" type="submit">Request access <span>↗</span></button>
      </form>
      <p className="auth-switch">Already on the team? <Link href="/login">Sign in</Link></p>
    </div>
  );
}
