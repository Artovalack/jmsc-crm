import { Building2, Info } from "lucide-react";
import { createB2BOpportunity, updateB2BStatus } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

const b2bStages = ["Prospecting", "Contacted", "Scoping", "Trial project", "Ongoing", "Closed"];
type Props = { searchParams: Promise<{ error?: string; message?: string; status?: string }> };

export default async function B2BPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  let opportunitiesQuery = supabase.from("b2b_opportunities").select("*").order("created_at", { ascending: false });
  if (params.status) opportunitiesQuery = opportunitiesQuery.eq("status", params.status);
  const [opportunitiesResult, profilesResult] = await Promise.all([
    opportunitiesQuery,
    supabase.from("profiles").select("id,full_name").eq("is_active", true),
  ]);
  if (opportunitiesResult.error || profilesResult.error) return <QueryError message={opportunitiesResult.error?.message || profilesResult.error?.message || "Query failed"} />;
  const owners = new Map(profilesResult.data.map((profile) => [profile.id, profile.full_name]));

  return (
    <>
      <PageHeading eyebrow="REGIONAL OUTSOURCING" title="B2B pipeline" description="Position JMSC as a reliable creative production partner for regional print shops." />
      <Notice error={params.error} message={params.message} />
      <div className="phase-note"><Info size={16} /><span><strong>Opportunity fit:</strong> vector layout support, print-ready assets, and overflow help for partners with production backlogs. Track volume and next action before promising capacity.</span></div>
      <div className="detail-grid">
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">RELATIONSHIPS IN PROGRESS</span><h2>Outsourcing opportunities</h2></div><span className="panel-meta">{opportunitiesResult.data.length} records</span></div>
          {opportunitiesResult.data.length ? <div className="card-list">{opportunitiesResult.data.map((opportunity) => <article className="info-card" key={opportunity.id}>
            <div className="info-card-top"><h3>{opportunity.organization}</h3><StatusBadge value={opportunity.status} /></div>
            <p>{opportunity.work_type} · {opportunity.backlog_volume || "Backlog volume not estimated"}</p>
            <div className="info-card-foot"><span>{opportunity.contact_name} · {opportunity.location || "Davao Region"}</span><span>{owners.get(opportunity.owner_id ?? "") || "Unassigned"}</span></div>
            <form action={updateB2BStatus} className="b2b-update-form">
              <input type="hidden" name="id" value={opportunity.id} /><input type="hidden" name="next_action" value={opportunity.next_action} />
              <label className="sr-only" htmlFor={`b2b-status-${opportunity.id}`}>Opportunity stage</label>
              <select id={`b2b-status-${opportunity.id}`} name="status" className="inline-select" defaultValue={opportunity.status}>{b2bStages.map((stage) => <option key={stage}>{stage}</option>)}</select>
              <button className="button button-secondary button-small">Update stage</button>
            </form>
            {opportunity.next_action && <div className="next-action-note"><b>Next:</b> {opportunity.next_action}</div>}
            <small className="cell-secondary">Added {formatDate(opportunity.created_at)}</small>
          </article>)}</div> : <div className="empty-state"><Building2 size={22} /><strong>No B2B opportunities yet</strong><p>Start with a regional shop that needs overflow layout or vector support.</p></div>}
        </section>
        <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">A THOUGHTFUL FIRST STEP</span><h2>Add an opportunity</h2></div></div>
          <form action={createB2BOpportunity} className="form-stack">
            <label className="field"><span>Print shop / organization</span><input name="organization" required maxLength={160} /></label>
            <label className="field"><span>Contact person</span><input name="contact_name" required maxLength={100} /></label>
            <label className="field"><span>Email</span><input name="email" type="email" /></label>
            <label className="field"><span>Phone</span><input name="phone" type="tel" /></label>
            <label className="field"><span>Location</span><input name="location" placeholder="Tagum, Nabunturan..." /></label>
            <label className="field"><span>Potential work</span><input name="work_type" required placeholder="Print-ready vector layouts" /></label>
            <label className="field"><span>Backlog / likely volume</span><input name="backlog_volume" placeholder="Approx. items per month or urgent backlog" /></label>
            <label className="field"><span>Stage</span><select name="status">{b2bStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
            <label className="field"><span>Owner</span><select name="owner_id"><option value="">Unassigned</option>{profilesResult.data.map((profile) => <option value={profile.id} key={profile.id}>{profile.full_name}</option>)}</select></label>
            <label className="field"><span>Next action</span><input name="next_action" placeholder="Ask about current layout backlog" /></label>
            <label className="field"><span>Notes</span><textarea name="notes" rows={3} /></label>
            <button className="button button-primary" type="submit">Add opportunity <span>↗</span></button>
          </form>
        </section>
      </div>
    </>
  );
}
