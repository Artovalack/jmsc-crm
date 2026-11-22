import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, Plus, Printer } from "lucide-react";
import { updateProductionStatus } from "@/app/actions";
import Notice from "@/components/notice";
import PageHeading from "@/components/page-heading";
import QueryError from "@/components/query-error";
import StatusBadge from "@/components/status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

const handoffStatuses = ["Preparing files", "Sent to partner", "Awaiting proof", "In production", "Quality check", "Ready", "Delivered", "Issue reported"];
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; message?: string }> };

export default async function PartnerDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const [partnerResult, handoffsResult, ordersResult, risksResult] = await Promise.all([
    supabase.from("partners").select("*").eq("id", id).maybeSingle(),
    supabase.from("production_handoffs").select("*").eq("partner_id", id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,title"),
    supabase.from("partner_risks").select("*").eq("partner_id", id).order("created_at", { ascending: false }),
  ]);
  const error = partnerResult.error || handoffsResult.error || ordersResult.error || risksResult.error;
  if (error) return <QueryError message={error.message} />;
  const partner = partnerResult.data;
  if (!partner) notFound();
  const orders = new Map(ordersResult.data.map((order) => [order.id, order.title]));

  return (
    <>
      <PageHeading eyebrow={partner.location || "PARTNER PROFILE"} title={partner.name} description={partner.capabilities || "Partner capabilities not recorded."} action={<Link className="button button-secondary" href="/partners">All partners</Link>} />
      <Notice error={notice.error} message={notice.message} />
      <div className="detail-grid">
        <div className="record-column">
          <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">PRODUCTION HISTORY</span><h2>Partner handoffs</h2></div><Link className="panel-link" href="/partners/handoffs/new"><Plus size={14} /> New handoff</Link></div>
            {handoffsResult.data.length ? <div className="card-list">{handoffsResult.data.map((handoff) => <article className="info-card" key={handoff.id}>
              <div className="info-card-top"><h3>{orders.get(handoff.order_id) || "Project"}</h3><StatusBadge value={handoff.status} /></div>
              <p>{handoff.quantity} pcs · {handoff.specifications}</p>
              <div className="info-card-foot"><span>Expected {formatDate(handoff.promised_date)}</span><span>{handoff.tracking_reference || "No tracking reference"}</span></div>
              <form action={updateProductionStatus} className="production-update-form">
                <input type="hidden" name="id" value={handoff.id} />
                <label className="field"><span>Production stage</span><select name="status" defaultValue={handoff.status}>{handoffStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label className="field"><span>Tracking / pickup reference</span><input name="tracking_reference" defaultValue={handoff.tracking_reference} maxLength={120} /></label>
                <label className="field"><span>Quality / schedule notes</span><textarea name="quality_notes" rows={2} defaultValue={handoff.quality_notes} /></label>
                <button className="button button-secondary button-small">Save handoff update</button>
              </form>
            </article>)}</div> : <div className="empty-state"><Printer size={22} /><strong>No jobs with this partner yet</strong><p>Create a handoff after the client has approved the production files.</p></div>}
          </section>
          <section className="panel detail-card"><div className="panel-heading"><div><span className="eyebrow">RISK & QUALITY NOTES</span><h2>Partner history</h2></div><Link className="panel-link" href="/partners/risks">Risk log ↗</Link></div>
            {risksResult.data.length ? <div className="card-list">{risksResult.data.map((risk) => <article className="info-card" key={risk.id}><div className="info-card-top"><h3>{risk.category} · {risk.severity}</h3><StatusBadge value={risk.status} /></div><p>{risk.summary}</p><div className="info-card-foot"><span>{orders.get(risk.order_id ?? "") || "Partner-wide"}</span><span>{formatDate(risk.created_at)}</span></div></article>)}</div> : <div className="empty-state"><AlertTriangle size={22} /><strong>No risk history</strong><p>Log quality and schedule issues early, while there&apos;s time to adapt.</p></div>}
          </section>
        </div>
        <section className="panel detail-card"><span className="eyebrow">CONTACT & CAPABILITIES</span><div className="detail-rows" style={{ marginTop: 10 }}>
          <div className="detail-row"><span>Primary contact</span><strong>{partner.contact_name || "—"}</strong></div>
          <div className="detail-row"><span>Email</span><strong>{partner.email || "—"}</strong></div>
          <div className="detail-row"><span>Phone</span><strong>{partner.phone || "—"}</strong></div>
          <div className="detail-row"><span>Location</span><strong>{partner.location || "—"}</strong></div>
          <div className="detail-row"><span>Status</span><strong>{partner.active ? "Active" : "Paused"}</strong></div>
          <div className="detail-row"><span>Notes</span><strong>{partner.notes || "No notes recorded."}</strong></div>
        </div><div className="notice-inline">Record agreed production dates as partner estimates, not guaranteed client deadlines.</div></section>
      </div>
    </>
  );
}
