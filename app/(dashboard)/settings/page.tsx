import { redirect } from "next/navigation";
import { updateMemberAccess } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  if (!isSupabaseConfigured()) redirect("/setup");
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return <QueryError message={authError.message} />;
  if (!user) redirect("/login");
  const { data: currentProfile, error: currentProfileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (currentProfileError) return <QueryError message={currentProfileError.message} />;
  if (currentProfile?.role !== "admin") redirect("/dashboard");
  const { data: profiles, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
  if (error) return <QueryError message={error.message} />;

  return (
    <>
      <PageHeading eyebrow="THE PEOPLE BEHIND THE STUDIO" title="Team settings" description="Approve workspace access and assign the right level of responsibility." />
      <Notice error={params.error} message={params.message} />
      <div className="phase-note"><span>!</span><span>New signups begin inactive. Only admins can approve members or change roles. Role-based table access is enforced by Supabase row-level security, not just this screen.</span></div>
      <section className="panel panel-pad">
        <div className="panel-heading"><div><span className="eyebrow">WORKSPACE ACCESS</span><h2>Team members</h2></div><span className="panel-meta">{profiles.filter((profile) => profile.is_active).length} active · {profiles.length} accounts</span></div>
        {profiles.length ? <div className="table-wrap"><table><thead><tr><th>Member</th><th>Access level</th><th>Approval</th><th>Change access</th></tr></thead><tbody>
          {profiles.map((profile) => <tr key={profile.id}>
            <td><div className="cell-primary">{profile.full_name || "Name not provided"}</div><div className="cell-secondary">Joined {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(profile.created_at))}</div></td>
            <td className="role-label">{profile.role.replace("_", " ")}</td><td><span className={`catalog-state ${profile.is_active ? "" : "catalog-state-off"}`}>{profile.is_active ? "ACTIVE" : "PENDING"}</span></td>
            <td><form action={updateMemberAccess} className="member-access-form">
              <input type="hidden" name="id" value={profile.id} />
              <label className="sr-only" htmlFor={`role-${profile.id}`}>Role for {profile.full_name || "member"}</label>
              <select id={`role-${profile.id}`} className="inline-select" name="role" defaultValue={profile.role}><option value="admin">Admin</option><option value="client_relations">Client relations</option><option value="creative">Creative</option><option value="finance">Finance</option><option value="member">Member</option></select>
              <label className="sr-only" htmlFor={`active-${profile.id}`}>Approval for {profile.full_name || "member"}</label>
              <select id={`active-${profile.id}`} className="inline-select" name="is_active" defaultValue={profile.is_active ? "yes" : "no"}><option value="yes">Active</option><option value="no">Pending / paused</option></select>
              <button className="button button-secondary button-small">Save</button>
            </form></td>
          </tr>)}
        </tbody></table></div> : <div className="empty-state"><span>◎</span><strong>No team accounts found</strong><p>Create an account through signup, then activate the first admin using the SQL in the README.</p></div>}
      </section>
    </>
  );
}
