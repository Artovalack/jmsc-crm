import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import SetupNotice from "@/components/setup-notice";
import { signOut } from "@/app/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new Error(`Could not load workspace membership: ${profileError.message}`);
  if (!profile || !profile.is_active) {
    return (
      <main className="pending-page">
        <div className="pending-card">
          <span className="eyebrow">ACCESS REQUEST RECEIVED</span>
          <h1>Your studio is<br /><em>getting ready.</em></h1>
          <p>Your account is awaiting approval from a JMSC workspace administrator. The CRM stays locked until then.</p>
          <form action={signOut}>
            <button className="button button-secondary" type="submit">Sign out</button>
          </form>
        </div>
      </main>
    );
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
